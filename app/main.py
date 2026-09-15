"""FastAPI application entrypoint."""

from contextlib import asynccontextmanager
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import models  # noqa: F401 - register tables before create_all
from app.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.chatbots import router as chatbots_router
from app.routers.knowledge import router as knowledge_router
from app.routers.chat import router as chat_router
from app.routers.widget import router as widget_router
from app.routers.demo import router as demo_router
from app.widget_cors import PublicWidgetCORSMiddleware


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="AI Customer Support Platform", lifespan=lifespan)
allowed_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PublicWidgetCORSMiddleware)
app.include_router(auth_router)
app.include_router(chatbots_router)
app.include_router(knowledge_router)
app.include_router(chat_router)
app.include_router(widget_router)
app.include_router(demo_router)


@app.get("/health", tags=["Health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
