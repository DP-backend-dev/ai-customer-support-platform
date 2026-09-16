"""Public visitor chat backed by Groq and a transaction-safe message log."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.groq_client import GroqGenerationError, generate_reply
from app.models import Chatbot, Conversation, KnowledgeEntry, Message
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/chatbots/{chatbot_id}/chat", tags=["Chat"])


def build_system_context(chatbot: Chatbot, entries: list[KnowledgeEntry]) -> str:
    facts = [
        "You are a customer support assistant for this business.",
        "Answer using only the business information and knowledge base below where possible.",
        "If the provided context does not answer a question, say honestly that you do not know. Do not invent facts.",
        f"Business information: {chatbot.business_info or 'Not provided'}",
        f"Tone: {chatbot.tone or 'Helpful and professional'}",
        f"Welcome message: {chatbot.welcome_message or 'Not provided'}",
        "Knowledge base:",
    ]
    facts.extend(
        f"{number}. Question: {entry.question}\nAnswer: {entry.answer}"
        for number, entry in enumerate(entries, start=1)
    )
    if not entries:
        facts.append("No knowledge base entries are available.")
    return "\n\n".join(facts)


@router.post("", response_model=ChatResponse)
def chat(
    chatbot_id: int, payload: ChatRequest, db: Session = Depends(get_db)
) -> ChatResponse:
    chatbot = db.get(Chatbot, chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")

    entries = list(
        db.scalars(
            select(KnowledgeEntry)
            .where(KnowledgeEntry.chatbot_id == chatbot_id)
            .order_by(KnowledgeEntry.id)
        ).all()
    )
    system_context = build_system_context(chatbot, entries)
    conversation = db.scalar(
        select(Conversation).where(
            Conversation.chatbot_id == chatbot_id,
            Conversation.visitor_identifier == payload.visitor_identifier,
        )
    )
    if conversation is None:
        conversation = Conversation(
            chatbot_id=chatbot_id, visitor_identifier=payload.visitor_identifier
        )
        db.add(conversation)

    try:
        db.flush()
        db.add(
            Message(conversation_id=conversation.id, role="user", content=payload.message)
        )
        db.flush()
        reply = generate_reply(system_context, payload.message)
        db.add(Message(conversation_id=conversation.id, role="bot", content=reply))
        db.commit()
    except GroqGenerationError as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="Chat is temporarily unavailable; please try again") from exc
    except Exception as exc:
        db.rollback()
        raise HTTPException(status_code=503, detail="Chat could not be saved; please try again") from exc

    return ChatResponse(reply=reply, conversation_id=conversation.id)
