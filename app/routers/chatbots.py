"""Owner-scoped chatbot management."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.auth import get_current_user
from app.database import get_db
from app.models import Chatbot, Conversation, User
from app.schemas import ChatbotCreate, ChatbotResponse, ChatbotUpdate, ConversationResponse

router = APIRouter(prefix="/chatbots", tags=["Chatbots"])


def get_owned_chatbot(db: Session, chatbot_id: int, user_id: int) -> Chatbot:
    chatbot = db.scalar(
        select(Chatbot).where(Chatbot.id == chatbot_id, Chatbot.owner_id == user_id)
    )
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot


def commit_or_503(db: Session) -> None:
    try:
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=503, detail="Database change could not be saved; please try again"
        ) from exc


@router.post("", response_model=ChatbotResponse, status_code=status.HTTP_201_CREATED)
def create_chatbot(
    payload: ChatbotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Chatbot:
    chatbot = Chatbot(owner_id=current_user.id, **payload.model_dump())
    db.add(chatbot)
    commit_or_503(db)
    return chatbot


@router.get("", response_model=list[ChatbotResponse])
def list_chatbots(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
) -> list[Chatbot]:
    return list(
        db.scalars(
            select(Chatbot).where(Chatbot.owner_id == current_user.id).order_by(Chatbot.id)
        ).all()
    )


@router.get("/{chatbot_id}", response_model=ChatbotResponse)
def get_chatbot(
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Chatbot:
    return get_owned_chatbot(db, chatbot_id, current_user.id)


@router.get("/{chatbot_id}/conversations", response_model=list[ConversationResponse])
def list_conversations(
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Conversation]:
    get_owned_chatbot(db, chatbot_id, current_user.id)
    conversations = list(
        db.scalars(
            select(Conversation)
            .where(Conversation.chatbot_id == chatbot_id)
            .options(selectinload(Conversation.messages))
            .order_by(Conversation.started_at.desc(), Conversation.id.desc())
        ).all()
    )
    for conversation in conversations:
        conversation.messages.sort(key=lambda message: (message.created_at, message.id))
    return conversations


@router.put("/{chatbot_id}", response_model=ChatbotResponse)
def update_chatbot(
    chatbot_id: int,
    payload: ChatbotUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Chatbot:
    chatbot = get_owned_chatbot(db, chatbot_id, current_user.id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(chatbot, field, value)
    commit_or_503(db)
    return chatbot


@router.delete("/{chatbot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_chatbot(
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    chatbot = get_owned_chatbot(db, chatbot_id, current_user.id)
    db.delete(chatbot)
    commit_or_503(db)
