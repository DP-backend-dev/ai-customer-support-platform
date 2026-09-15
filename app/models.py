"""SQLAlchemy models for accounts and future support features."""

from datetime import datetime, timezone

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    chatbots: Mapped[list["Chatbot"]] = relationship(
        back_populates="owner", cascade="all, delete-orphan", passive_deletes=True
    )


class Chatbot(Base):
    __tablename__ = "chatbots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    business_info: Mapped[str | None] = mapped_column(Text, nullable=True)
    tone: Mapped[str | None] = mapped_column(String(100), nullable=True)
    primary_color: Mapped[str | None] = mapped_column(String(50), nullable=True)
    logo_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    welcome_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    owner: Mapped[User] = relationship(back_populates="chatbots")
    knowledge_entries: Mapped[list["KnowledgeEntry"]] = relationship(
        back_populates="chatbot", cascade="all, delete-orphan", passive_deletes=True
    )
    conversations: Mapped[list["Conversation"]] = relationship(
        back_populates="chatbot", cascade="all, delete-orphan", passive_deletes=True
    )


class KnowledgeEntry(Base):
    __tablename__ = "knowledge_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chatbot_id: Mapped[int] = mapped_column(ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    chatbot: Mapped[Chatbot] = relationship(back_populates="knowledge_entries")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    chatbot_id: Mapped[int] = mapped_column(ForeignKey("chatbots.id", ondelete="CASCADE"), nullable=False, index=True)
    visitor_identifier: Mapped[str] = mapped_column(String(255), nullable=False)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    chatbot: Mapped[Chatbot] = relationship(back_populates="conversations")
    messages: Mapped[list["Message"]] = relationship(
        back_populates="conversation", cascade="all, delete-orphan", passive_deletes=True
    )


class Message(Base):
    __tablename__ = "messages"
    __table_args__ = (CheckConstraint("role IN ('user', 'bot')", name="ck_messages_role"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    conversation_id: Mapped[int] = mapped_column(ForeignKey("conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(4), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    conversation: Mapped[Conversation] = relationship(back_populates="messages")
