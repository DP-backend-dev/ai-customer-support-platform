"""Small wrapper around the official Google Gen AI Python SDK."""

import hashlib
import json
import logging
import os
import re
from importlib.metadata import version
from typing import Any

from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

logger = logging.getLogger(__name__)
GEMINI_MODEL = "gemini-3.8-flash"
GEMINI_API_VERSION = "v1"
GEMINI_RETRY_ATTEMPTS = 3
GEMINI_SDK_VERSION = version("google-genai")

_SENSITIVE_ENV_NAMES = (
    "GEMINI_API_KEY",
    "DATABASE_URL",
    "SECRET_KEY",
)
_SECRET_ASSIGNMENT_PATTERN = re.compile(
    r"(?i)\b(api[_-]?key|authorization|database_url|secret_key|password|token)"
    r"(\s*[:=]\s*)([^,\s}\]]+)"
)
_SECRET_QUERY_PATTERN = re.compile(r"(?i)([?&](?:key|token)=)[^&\s]+")
_AUTHORIZATION_BEARER_PATTERN = re.compile(
    r"(?i)\b(authorization\s*[:=]\s*bearer\s+)[^,\s}\]]+"
)

GEMINI_HTTP_OPTIONS = types.HttpOptions(
    api_version=GEMINI_API_VERSION,
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


def _redact_text(value: Any, protected_values: tuple[str, ...]) -> str | None:
    if value is None:
        return None

    text = str(value)
    for secret_name in _SENSITIVE_ENV_NAMES:
        secret_value = os.getenv(secret_name)
        if secret_value:
            text = text.replace(secret_value, "[REDACTED]")
    for protected_value in protected_values:
        if protected_value:
            text = text.replace(protected_value, "[REDACTED]")
    text = _AUTHORIZATION_BEARER_PATTERN.sub(r"\1[REDACTED]", text)
    text = _SECRET_ASSIGNMENT_PATTERN.sub(r"\1\2[REDACTED]", text)
    text = _SECRET_QUERY_PATTERN.sub(r"\1[REDACTED]", text)
    return text[:1000]


def _safe_provider_details(
    exc: Exception, protected_values: tuple[str, ...]
) -> dict[str, Any]:
    raw_details = getattr(exc, "details", None)
    if not isinstance(raw_details, dict):
        return {"format": type(raw_details).__name__}

    error = raw_details.get("error", raw_details)
    if not isinstance(error, dict):
        return {"format": type(error).__name__}

    safe_details: dict[str, Any] = {}
    for key in ("code", "status", "message"):
        value = error.get(key)
        if value is not None:
            safe_details[key] = (
                _redact_text(value, protected_values) if isinstance(value, str) else value
            )

    nested_details = error.get("details")
    if isinstance(nested_details, list):
        safe_details["details"] = [
            {
                key: _redact_text(item[key], protected_values)
                for key in ("@type", "reason", "domain")
                if isinstance(item, dict) and isinstance(item.get(key), str)
            }
            for item in nested_details
            if isinstance(item, dict)
        ]
    return safe_details


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
        protected_values = (system_context, user_message)
        context_digest = hashlib.sha256(system_context.encode("utf-8")).hexdigest()[:16]
        logger.error(
            "Gemini generation failed: model=%s api_version=%s sdk_version=%s "
            "retry_limit=%s timeout=sdk_default proxy_configured=%s "
            "request_shape=system_instruction+text_contents conversation_history=false "
            "context_chars=%s context_bytes=%s context_sha256=%s "
            "user_message_chars=%s user_message_bytes=%s error_type=%s code=%s "
            "status=%s provider_message=%s provider_details=%s",
            GEMINI_MODEL,
            GEMINI_API_VERSION,
            GEMINI_SDK_VERSION,
            GEMINI_RETRY_ATTEMPTS,
            any(os.getenv(name) for name in ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY")),
            len(system_context),
            len(system_context.encode("utf-8")),
            context_digest,
            len(user_message),
            len(user_message.encode("utf-8")),
            type(exc).__name__,
            getattr(exc, "code", None),
            getattr(exc, "status", None),
            _redact_text(getattr(exc, "message", None), protected_values),
            json.dumps(
                _safe_provider_details(exc, protected_values),
                ensure_ascii=True,
                separators=(",", ":"),
            ),
        )
        raise GeminiError("Gemini service could not generate a reply") from exc

    if not reply or not reply.strip():
        raise GeminiError("Gemini returned an empty reply")
    return reply.strip()
