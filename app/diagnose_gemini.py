"""Run the production chat prompt path without creating conversation records."""

import argparse
import hashlib
import json

from sqlalchemy import select

from app.database import SessionLocal
from app.gemini import (
    GEMINI_API_VERSION,
    GEMINI_MODEL,
    GEMINI_SDK_VERSION,
    GeminiError,
    generate_reply,
)
from app.models import Chatbot, KnowledgeEntry
from app.routers.chat import build_system_context


def diagnose(chatbot_id: int, user_message: str) -> None:
    with SessionLocal() as db:
        chatbot = db.get(Chatbot, chatbot_id)
        if chatbot is None:
            raise RuntimeError(f"Chatbot {chatbot_id} was not found")
        entries = list(
            db.scalars(
                select(KnowledgeEntry)
                .where(KnowledgeEntry.chatbot_id == chatbot_id)
                .order_by(KnowledgeEntry.id)
            ).all()
        )
        system_context = build_system_context(chatbot, entries)

    context_bytes = system_context.encode("utf-8")
    request_summary = {
        "chatbot_id": chatbot_id,
        "knowledge_entries": len(entries),
        "model": GEMINI_MODEL,
        "api_version": GEMINI_API_VERSION,
        "sdk_version": GEMINI_SDK_VERSION,
        "request_shape": "system_instruction+text_contents",
        "conversation_history_included": False,
        "context_chars": len(system_context),
        "context_bytes": len(context_bytes),
        "context_sha256": hashlib.sha256(context_bytes).hexdigest()[:16],
        "user_message_chars": len(user_message),
        "user_message_bytes": len(user_message.encode("utf-8")),
    }
    print(json.dumps(request_summary, sort_keys=True))
    try:
        reply = generate_reply(system_context, user_message)
    except GeminiError:
        print(json.dumps({"generation": "failure"}))
        raise SystemExit(1) from None
    print(json.dumps({"generation": "success", "reply_chars": len(reply)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Exercise the same Gemini prompt construction used by the public chat route."
    )
    parser.add_argument("--chatbot-id", type=int, default=1)
    parser.add_argument(
        "--message",
        default="What are your opening hours?",
        help="Visitor message to send. The message text is never printed.",
    )
    args = parser.parse_args()
    diagnose(args.chatbot_id, args.message)
