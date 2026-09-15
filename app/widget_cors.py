"""CORS policy for the two public endpoints used by third-party widgets."""

import re

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

PUBLIC_WIDGET_PATH = re.compile(
    r"^/chatbots/[^/]+/(?:chat|public-config)/?$"
)


class PublicWidgetCORSMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if not PUBLIC_WIDGET_PATH.fullmatch(request.url.path):
            return await call_next(request)

        headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Max-Age": "600",
        }
        if request.method == "OPTIONS":
            return Response(status_code=204, headers=headers)

        response = await call_next(request)
        for name, value in headers.items():
            response.headers[name] = value
        if "access-control-allow-credentials" in response.headers:
            del response.headers["access-control-allow-credentials"]
        return response
