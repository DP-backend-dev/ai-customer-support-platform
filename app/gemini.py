"""Small wrapper around the official Google Gen AI Python SDK."""

import os

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()


class GeminiError(Exception):
    """A reply could not be generated."""


def generate_reply(system_context: str, user_message: str) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise GeminiError("Gemini API key is not configured")

    try:
        with genai.Client(api_key=api_key) as client:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                config=types.GenerateContentConfig(system_instruction=system_context),
                contents=user_message,
            )
            reply = response.text
    except Exception as exc:
        raise GeminiError("Gemini service could not generate a reply") from exc

    if not reply or not reply.strip():
        raise GeminiError("Gemini returned an empty reply")
    return reply.strip()
