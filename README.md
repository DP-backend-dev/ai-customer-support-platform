# AI Customer Support Platform — Steps 1–6

This project provides account signup and login, owner-scoped chatbot and knowledge-base management, Gemini-powered chat, conversation history, the authenticated React console, a dependency-free embeddable chat widget, and a public marketing page with a live product demo. Analytics are not included.

## Run locally

1. Create a PostgreSQL database.
2. Install Python 3.10+ and run `pip install -r requirements.txt` from this directory.
3. Copy `.env.example` to `.env`. Set `DATABASE_URL` to your PostgreSQL connection URL, replace `SECRET_KEY` with a long, random secret, set the token lifetime in minutes, provide your `GEMINI_API_KEY`, and list the frontend origins allowed to call the API in `ALLOWED_ORIGINS`.
4. Run `uvicorn app.main:app --reload` from this directory.

The app creates its initial tables on startup. Open `http://127.0.0.1:8000/docs` to try the API. `GET /health` returns `{"status": "ok"}`.

`POST /auth/signup` accepts `{"email": "person@example.com", "password": "at-least-8-chars", "name": "Person"}` and returns the public user fields plus an access token. `POST /auth/login` accepts `{"email": "person@example.com", "password": "at-least-8-chars"}` and returns an access token. For future protected routes, send it as `Authorization: Bearer <access_token>`.

The built-in Swagger OAuth2 authorization dialog uses form-encoded credentials, while this API's login endpoint intentionally accepts JSON. Use the login endpoint in `/docs` and copy its access token into an Authorization header when testing a protected route.

## Step 2 endpoints

Chatbot management requires a bearer token: `POST /chatbots`, `GET /chatbots`, `GET /chatbots/{chatbot_id}`, `PUT /chatbots/{chatbot_id}`, and `DELETE /chatbots/{chatbot_id}`. Each operation is restricted to chatbots owned by the signed-in user.

Knowledge-base management also requires a bearer token: `POST` and `GET /chatbots/{chatbot_id}/knowledge`, plus `PUT` and `DELETE /chatbots/{chatbot_id}/knowledge/{entry_id}`. Questions and answers are required when creating entries.

Visitor chat is public: `POST /chatbots/{chatbot_id}/chat` with `{"visitor_identifier": "visitor-123", "message": "What do you sell?"}`. The response contains `reply` and `conversation_id`. The endpoint reuses a conversation for the same chatbot and visitor identifier, includes all current knowledge entries in the Gemini context, and rolls back its database writes if Gemini fails.

Authenticated owners can retrieve newest-first conversation history, including messages, from `GET /chatbots/{chatbot_id}/conversations`.

## Run the frontend

1. Open another terminal in `frontend`.
2. Copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_BASE_URL` to the backend URL.
3. Run `npm install` and then `npm run dev`.
4. Open the URL shown by Vite, normally `http://localhost:5173`.

The backend's `ALLOWED_ORIGINS` must contain the exact frontend origin. Multiple origins are comma-separated, for example `http://localhost:5173,https://console.example.com`.

The console supports signup, login, logout, guarded application routes, chatbot creation and editing, inline knowledge-base management, live chatbot testing, and expandable past conversations. Its API client reads `VITE_API_BASE_URL`, attaches the stored JWT to authenticated requests, and returns expired sessions to the login page.

## Embed the chat widget

Open a chatbot in the console and use its **Embed Code** section to copy the exact script tag. Paste it immediately before the closing `</body>` tag on the business website:

```html
<script src="https://your-api.example.com/widget.js" data-chatbot-id="123"></script>
```

The script gets its API origin from its own `src`, loads the chatbot's public branding, and renders the bubble inside Shadow DOM so widget styles do not affect the host page. It keeps a namespaced visitor ID in session storage and sends messages to the existing public chat endpoint.

`GET /chatbots/{chatbot_id}/public-config` exposes only `name`, `primary_color`, `logo_url`, and `welcome_message`. Widget config and chat permit requests from arbitrary origins. Authenticated API routes continue to use the explicit `ALLOWED_ORIGINS` list.

For a quick local check, edit the chatbot ID in `widget-demo.html`, start the API, and open the file in a browser.

## Seed and run the landing-page demo

Run the seed once from this directory after configuring the backend environment:

```bash
python -m app.seed_demo
```

The command is safe to rerun. It reuses `demo@internal.local` and the Harbor & Hearth chatbot, then adds only missing seed questions. The generated account password is random and is not printed or stored in the source.

`GET /demo-chatbot-id` returns the seeded chatbot ID. The public landing page at `/` uses that ID to load the normal public config endpoint and submit every visitor message to the normal public chat endpoint. Gemini generation and conversation/message persistence follow the same backend path as a customer's chatbot.

The landing page includes the public navigation, requestAnimationFrame-batched hero parallax, idle gradient motion, a live demo chat, feature cards, and a minimal footer. The authenticated `/dashboard` and chatbot routes remain behind the existing token guard.

## Deployment

The repository includes `render.yaml`, which defines a Render Python web service for the API and a Render static site for the React application. Commit and push this directory as the repository root, then choose **New > Blueprint** in Render and connect the repository. Render reads both services from the Blueprint.

The API uses `pip install -r requirements.txt` as its build command and `python -m app.run` as its start command. The launcher binds Uvicorn to `0.0.0.0` and reads Render's `PORT`; local runs default to port `8000`. The health check is `/health`. Python dependencies are pinned to exact tested versions in `requirements.txt` so deploys are repeatable.

Set these API environment variables in the Render dashboard when the Blueprint prompts for them:

| Variable | Value to provide |
| --- | --- |
| `DATABASE_URL` | The production PostgreSQL connection URL. Use Render Postgres's external or internal URL as appropriate for the service. |
| `SECRET_KEY` | A long, cryptographically random production secret. Never reuse the placeholder from `.env.example`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | The desired JWT lifetime as a whole number, such as `30`. |
| `GEMINI_API_KEY` | The production Gemini API key. |
| `ALLOWED_ORIGINS` | The exact deployed frontend origin, such as `https://ai-support-platform-web.onrender.com`. Separate multiple origins with commas and do not add a trailing slash. |

Render supplies `PORT`; do not create it manually. The dashboard CORS middleware reads the comma-separated `ALLOWED_ORIGINS` value at runtime. The public widget configuration and chat routes retain their separate any-origin policy, while authenticated endpoints retain the explicit allowlist.

The static frontend uses the committed pnpm lockfile, runs `pnpm install --frozen-lockfile`, and writes the production build to `frontend/dist`. Set `VITE_API_BASE_URL` on the static service to the deployed API origin, for example `https://ai-support-platform-api.onrender.com`, with no trailing slash. Vite embeds this variable at build time, so trigger a new frontend deploy whenever it changes. The Blueprint's `/*` rewrite serves `/index.html` for client-side routes such as `/dashboard`; `frontend/public/_redirects` supplies the equivalent fallback on Netlify. For a manual build, run `npm install` and `npm run build` inside `frontend`.

After the database and API are live, run the demo seed exactly once from a Render Shell attached to the API service:

```bash
python -m app.seed_demo
```

The seed is idempotent and may be rerun safely if the first command is interrupted. Confirm the static site's deployed origin is present in `ALLOWED_ORIGINS`, then redeploy the API after changing that setting. The widget embed snippet must point to the deployed API origin because that service serves `/widget.js`.

Keep local `.env` files out of source control. The repository's `.gitignore` excludes backend and frontend environment files while retaining the two `.env.example` templates, which contain placeholders only.

## Manual QA Checklist

- [ ] Open the deployed landing page without signing in and confirm every section loads at mobile (375px), tablet (768px), and desktop widths.
- [ ] Move the pointer over the hero and confirm its parallax responds smoothly; confirm the layout remains usable on a touch device.
- [ ] Use the landing-page live demo without an account and confirm it returns a real Gemini reply grounded in the seeded knowledge base.
- [ ] Create a fresh account, sign out, sign back in, and confirm invalid credentials show a clear error.
- [ ] Create a chatbot and add, edit, and delete knowledge entries.
- [ ] Send a test-chat message and confirm a real Gemini reply appears.
- [ ] Expand Past Conversations and confirm the test exchange appears in its saved conversation.
- [ ] Switch the authenticated console between dark and light modes, refresh the page, and confirm the choice persists.
- [ ] Copy the chatbot's embed code, place it before `</body>` in a separate HTML page, and confirm the branded widget opens and chats successfully.
- [ ] Log out and confirm protected dashboard, editor, and chatbot URLs redirect to `/login`.
- [ ] Refresh `/dashboard` and a chatbot detail URL directly on the static host and confirm the React app loads instead of a host 404 page.
- [ ] Review `.env.example` and `frontend/.env.example`, and verify no `.env` file or real database password, JWT secret, or Gemini key is committed.
- [ ] From an origin absent from `ALLOWED_ORIGINS`, confirm a browser preflight for an authenticated dashboard endpoint is rejected.
- [ ] From a separate test-page origin, confirm `/chatbots/{id}/public-config` and `POST /chatbots/{id}/chat` return the required CORS headers and work normally.
- [ ] Temporarily use an invalid chatbot ID in the widget and confirm it displays “Chat is currently unavailable.”
