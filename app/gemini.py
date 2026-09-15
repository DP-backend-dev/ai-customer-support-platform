"""Small wrapper around the official Google Gen AI Python SDK."""

import logging
import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)
GEMINI_MODEL = "gemini-3.8-flash"
GEMINI_RETRY_ATTEMPTS = 3

GEMINI_HTTP_OPTIONS = types.HttpOptions(
    api_version="v1",
    retry_options=types.HttpRetryOptions(
        attempts=GEMINI_RETRY_ATTEMPTS,
        initial_delay=1.0,
        max_delay=4.0,
        exp_base=2.0,
        jitter=0.25,
        http_status_codes=[503],
    ),
)


class GeminiError(Exception):
    """A reply could not be generated."""


def generate_reply(system_context: str, user_message: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logger.error("Gemini generation failed: GEMINI_API_KEY is not configured")
        raise GeminiError("Gemini API key is not configured")

    try:
        with genai.Client(api_key=api_key, http_options=GEMINI_HTTP_OPTIONS) as client:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                config=types.GenerateContentConfig(system_instruction=system_context),
                contents=user_message,
            )
            reply = response.text
    except Exception as exc:
        logger.error(
            "Gemini generation failed: model=%s retry_limit=%s error_type=%s code=%s status=%s",
            GEMINI_MODEL,
            GEMINI_RETRY_ATTEMPTS,
            type(exc).__name__,
            getattr(exc, "code", None),
            getattr(exc, "status", None),
        )
        raise GeminiError("Gemini service could not generate a reply") from exc

    if not reply or not reply.strip():
        raise GeminiError("Gemini returned an empty reply")
    return reply.strip()
