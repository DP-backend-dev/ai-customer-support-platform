"""Production launcher that honors the platform-provided port."""

import os

import uvicorn


def main() -> None:
    try:
        port = int(os.getenv("PORT", "8000"))
    except ValueError as exc:
        raise RuntimeError("PORT must be an integer") from exc

    uvicorn.run("app.main:app", host="0.0.0.0", port=port)


if __name__ == "__main__":
    main()
