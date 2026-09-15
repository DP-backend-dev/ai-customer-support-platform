"""Knowledge entries scoped through chatbot ownership."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.auth import get_current_user
from app.database import get_db
from app.models import KnowledgeEntry, User
from app.routers.chatbots import commit_or_503, get_owned_chatbot
from app.schemas import KnowledgeCreate, KnowledgeResponse, KnowledgeUpdate

router = APIRouter(prefix="/chatbots/{chatbot_id}/knowledge", tags=["Knowledge Base"])


def get_chatbot_entry(db: Session, chatbot_id: int, entry_id: int) -> KnowledgeEntry:
    entry = db.scalar(
        select(KnowledgeEntry).where(
            KnowledgeEntry.id == entry_id, KnowledgeEntry.chatbot_id == chatbot_id
        )
    )
    if entry is None:
        raise HTTPException(status_code=404, detail="Knowledge entry not found")
    return entry


@router.post("", response_model=KnowledgeResponse, status_code=status.HTTP_201_CREATED)
def create_knowledge_entry(
    chatbot_id: int,
    payload: KnowledgeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KnowledgeEntry:
    get_owned_chatbot(db, chatbot_id, current_user.id)
    entry = KnowledgeEntry(chatbot_id=chatbot_id, **payload.model_dump())
    db.add(entry)
    commit_or_503(db)
    return entry


@router.get("", response_model=list[KnowledgeResponse])
def list_knowledge_entries(
    chatbot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[KnowledgeEntry]:
    get_owned_chatbot(db, chatbot_id, current_user.id)
    return list(
        db.scalars(
            select(KnowledgeEntry)
            .where(KnowledgeEntry.chatbot_id == chatbot_id)
            .order_by(KnowledgeEntry.id)
        ).all()
    )


@router.put("/{entry_id}", response_model=KnowledgeResponse)
def update_knowledge_entry(
    chatbot_id: int,
    entry_id: int,
    payload: KnowledgeUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> KnowledgeEntry:
    get_owned_chatbot(db, chatbot_id, current_user.id)
    entry = get_chatbot_entry(db, chatbot_id, entry_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    commit_or_503(db)
    return entry


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_knowledge_entry(
    chatbot_id: int,
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    get_owned_chatbot(db, chatbot_id, current_user.id)
    entry = get_chatbot_entry(db, chatbot_id, entry_id)
    db.delete(entry)
    commit_or_503(db)
