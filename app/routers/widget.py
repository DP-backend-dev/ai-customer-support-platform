"""Public widget script and branding configuration."""

from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Chatbot
from app.schemas import PublicChatbotConfig

router = APIRouter(tags=["Widget"])
WIDGET_SCRIPT = Path(__file__).resolve().parents[1] / "static" / "widget.js"


@router.get("/widget.js", include_in_schema=False)
def widget_script() -> FileResponse:
    return FileResponse(WIDGET_SCRIPT, media_type="application/javascript")


@router.get(
    "/chatbots/{chatbot_id}/public-config",
    response_model=PublicChatbotConfig,
)
def public_chatbot_config(
    chatbot_id: int, db: Session = Depends(get_db)
) -> Chatbot:
    chatbot = db.get(Chatbot, chatbot_id)
    if chatbot is None:
        raise HTTPException(status_code=404, detail="Chatbot not found")
    return chatbot
