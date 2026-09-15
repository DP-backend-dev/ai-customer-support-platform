"""Public lookup for the manually seeded landing-page demo chatbot."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Chatbot, User
from app.schemas import DemoChatbotResponse

DEMO_USER_EMAIL = "demo@internal.local"
DEMO_CHATBOT_NAME = "Harbor & Hearth Assistant"

router = APIRouter(tags=["Demo"])


@router.get("/demo-chatbot-id", response_model=DemoChatbotResponse)
def demo_chatbot_id(db: Session = Depends(get_db)) -> DemoChatbotResponse:
    chatbot_id = db.scalar(
        select(Chatbot.id)
        .join(User, Chatbot.owner_id == User.id)
        .where(
            User.email == DEMO_USER_EMAIL,
            Chatbot.name == DEMO_CHATBOT_NAME,
        )
        .order_by(Chatbot.id)
    )
    if chatbot_id is None:
        raise HTTPException(
            status_code=404,
            detail="Demo chatbot is not available; run python -m app.seed_demo",
        )
    return DemoChatbotResponse(chatbot_id=chatbot_id)
