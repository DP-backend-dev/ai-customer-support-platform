"""Public request and response shapes. Password hashes are never serialized."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str = Field(min_length=1)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value

    @field_validator("password")
    @classmethod
    def bcrypt_password_limit(cls, value: str) -> str:
        if len(value.encode("utf-8")) > 72:
            raise ValueError("Password must be at most 72 UTF-8 bytes for bcrypt")
        return value


class LoginRequest(BaseModel):
    email: EmailStr
    password: str

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, value: object) -> object:
        return value.strip().lower() if isinstance(value, str) else value


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    name: str
    created_at: datetime


class SignupResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user: UserResponse
    access_token: str
    token_type: str = "bearer"


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type: str = "bearer"


class ChatbotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    business_info: str | None = None
    tone: str | None = Field(default=None, max_length=100)
    primary_color: str | None = Field(default=None, max_length=50)
    logo_url: str | None = None
    welcome_message: str | None = None

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Chatbot name is required")
        return value


class ChatbotUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    business_info: str | None = None
    tone: str | None = Field(default=None, max_length=100)
    primary_color: str | None = Field(default=None, max_length=50)
    logo_url: str | None = None
    welcome_message: str | None = None

    @field_validator("name")
    @classmethod
    def nonblank_name(cls, value: str | None) -> str:
        if value is None or not value.strip():
            raise ValueError("Chatbot name cannot be empty")
        return value.strip()


class ChatbotResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    owner_id: int
    name: str
    business_info: str | None
    tone: str | None
    primary_color: str | None
    logo_url: str | None
    welcome_message: str | None
    created_at: datetime


class KnowledgeCreate(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)

    @field_validator("question", "answer")
    @classmethod
    def nonblank_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Question and answer cannot be blank")
        return value


class KnowledgeUpdate(BaseModel):
    question: str | None = Field(default=None, min_length=1)
    answer: str | None = Field(default=None, min_length=1)

    @field_validator("question", "answer")
    @classmethod
    def nonblank_text(cls, value: str | None) -> str:
        if value is None or not value.strip():
            raise ValueError("Question and answer cannot be blank")
        return value.strip()


class KnowledgeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chatbot_id: int
    question: str
    answer: str
    created_at: datetime


class ChatRequest(BaseModel):
    visitor_identifier: str = Field(min_length=1, max_length=255)
    message: str = Field(min_length=1)

    @field_validator("visitor_identifier", "message")
    @classmethod
    def nonblank_text(cls, value: str) -> str:
        if not value.strip():
            raise ValueError("Value cannot be blank")
        return value


class ChatResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    reply: str
    conversation_id: int


class MessageResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    conversation_id: int
    role: str
    content: str
    created_at: datetime


class ConversationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    chatbot_id: int
    visitor_identifier: str
    started_at: datetime
    messages: list[MessageResponse]


class PublicChatbotConfig(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: str
    primary_color: str | None
    logo_url: str | None
    welcome_message: str | None


class DemoChatbotResponse(BaseModel):
    chatbot_id: int
