# CogniGraph

A personal study workspace for KTU S3 CSE, with Gemini chat, a persistent Neo4j knowledge graph, saved notes, resource and YouTube recommendations, and editable PowerPoint generation.

## Run locally

Requires Node.js 22.12+ and either Docker Compose or a running Neo4j 5.26+ database (including Neo4j Aura).

```bash
npm install
cp .env.example .env  # skip if .env already exists
```

Edit `.env`:

To use OpenRouter free models for chat and PPT generation, create an API key at [OpenRouter](https://openrouter.ai/settings/keys) and set these server-only values in `.env`, then restart `npm run dev`:

```dotenv
AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=openrouter/free
```

`openrouter/free` routes only to free models. You can also choose an explicit model ID ending in `:free`; paid model IDs are rejected by this integration. Free models have rate limits and variable availability. Responses are validated and retried once if malformed. Keys are never sent to the browser.

Set `AI_PROVIDER=gemini` to keep Gemini primary; when `OPENROUTER_API_KEY` is configured, OpenRouter handles provider failures, timeouts and quota exhaustion. Without `AI_PROVIDER`, the server chooses OpenRouter when its key is present, otherwise Gemini. Chat history and relevant graph context are sent to the selected provider.

- `GEMINI_API_KEY`: create a key in [Google AI Studio](https://aistudio.google.com/apikey).
- `GEMINI_MODEL`: defaults to `gemini-2.5-flash`; use a model available to your key that supports structured JSON output.
- `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`: database credentials. For local Docker, use `bolt://127.0.0.1:7687`, username `neo4j`, and choose a password. For Aura, use its `neo4j+s://…` URI and credentials.
- `SESSION_SECRET`: a stable random secret, at least 32 characters. Generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
- `GEMINI_FALLBACK_MODEL` (optional): defaults to `gemini-2.5-flash`. If the primary model returns a temporary 502/503 availability error, generation tries this model once. Quota and authentication errors do not trigger fallback.
- `YOUTUBE_API_KEY` (optional): a Google Cloud API key with **YouTube Data API v3** enabled. This is separate from Gemini access.

```bash
docker compose up -d
npm run dev
```

Open **http://localhost:5173**. The API runs at `127.0.0.1:3001`; Vite proxies `/api`. On the first database request, the server creates uniqueness constraints and idempotently seeds 7 courses, 15 concepts, and 44 resources. Database data survives Docker restarts in the `neo4j_data` volume. Neo4j Browser is available at http://localhost:7474.

If an ignored `.env` was created during setup, its local database password and session secret are already generated; fill in your API keys. Restart the server after changing environment settings. Changing a Docker password after the database is initialized does not rotate its existing credentials; use Neo4j's password management instead.

Without a reachable database, the app displays a **catalog preview**, with AI and writes disabled. Configure the database and click **Reconnect**. A configured Gemini key is not proof that the provider has accepted it: invalid keys, unavailable models, timeouts, and exhausted quotas produce visible errors.

## Use the workspace

1. Open **Your learning profile**, select your experience, enter a goal, and check concepts you already understand. Save the profile.
2. Use **Add material** to save a link or paste actual notes, with a course, concepts, and summary. Personal materials appear in search and the graph. You can remove personal materials; the shared catalog is read-only.
3. **Chat** with follow-up questions. The server retrieves relevant saved materials, traverses their prerequisites, and gives Gemini that context together with your profile and recent conversation. Resource cards link only to references from the retrieved catalog.
4. Enable **Include YouTube** for tutorial suggestions. With the YouTube key, recommendations use real video search results. Without it, or if YouTube fails, the app labels its fallback as a YouTube search link; it never invents video IDs.
5. Choose **Create PPT**, enter a topic, and select 4–12 slides. Gemini generates a validated outline and PptxGenJS builds a real `.pptx` download with teaching bullets, speaker notes, and saved-reference citations in the notes.

Personal workspaces use signed, HTTP-only browser cookies. Notes, profiles, and conversations are persisted in Neo4j and isolated by learner ID. Clearing the cookie or changing `SESSION_SECRET` loses access from that browser. This is browser-based personal identity, **not account login or cross-device synchronization**.

Saved URLs store metadata only. The server does **not** automatically read Google Drive folders, OneDrive files, PDFs, or YouTube transcripts. Paste note text to include its contents in the tutor's context. Relevant note excerpts, your goal/profile, and recent conversation are transmitted to Gemini for chat and slide generation. General model knowledge is allowed for teaching, but the tutor is instructed to distinguish it from saved notes.

## Architecture

- `src/domain`: shared academic, learner, and chat types.
- `src/data/sampleKnowledgeBase.ts`: seed catalog and offline preview.
- `src/services/knowledgeService.ts`: local catalog search, graph construction, and statistics. Graph IDs are namespaced to avoid concept/resource collisions.
- `src/hooks/useKnowledgeBase.ts`: API connection and workspace loading.
- `src/components`: graph, resource search, material creation, learning profile, and chat/PPT interface.
- `server/database.ts`: Neo4j persistence, catalog seeding, ownership checks, history, and profile updates.
- `server/retrieval.ts`: relevance-ranked lexical retrieval and recursive prerequisite expansion, with cycle protection. This is graph-grounded retrieval; **embedding/vector search is not implemented**.
- `server/gemini.ts`: server-only Google Gen AI SDK, structured JSON output, grounded reference filtering, and provider error handling.
- `server/youtube.ts`: YouTube Data API search, bounded short-lived cache, and explicit fallback.
- `server/presentation.ts`: editable PowerPoint rendering without remote file fetching.
- `server/app.ts`: validated API, signed browser sessions, origin checks, request limits, and rate limits.

Neo4j relationships:

```text
(Course)-[:CONTAINS]->(Concept)
(Concept)-[:PREREQUISITE_OF]->(Concept)
(Course)-[:HAS_RESOURCE]->(Resource)
(Concept)-[:SUPPORTS]->(Resource)
(Learner)-[:KNOWS]->(Concept)
(Learner)-[:SAVED]->(Resource)
(Learner)-[:SENT]->(Message)
```

Cypher queries are parameterized; Gemini does not execute generated Cypher. Resource access is scoped to the shared catalog plus the current learner. Individual known concepts and relationships are stored in Neo4j, rather than merely cached in the browser.

## API

| Endpoint                    | Purpose                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `GET /api/health`           | Database connectivity and provider configuration flags; no secrets |
| `GET /api/workspace`        | Catalog, personal resources, profile, and latest 40 messages       |
| `PUT /api/profile`          | Update experience, goal, and known concepts                        |
| `POST /api/resources`       | Save personal material and concept links                           |
| `DELETE /api/resources/:id` | Delete an owned material                                           |
| `POST /api/chat`            | Send `{ message, includeVideos }`; persist a completed turn        |
| `DELETE /api/chat`          | Clear conversation without removing notes or profile               |
| `POST /api/presentations`   | Send `{ topic, slideCount }`; download a PPTX                      |

Write requests require `Content-Type: application/json`. Browser origins must match `APP_ORIGIN` exactly. The current learner comes from the signed cookie, never from a caller-supplied user ID. Chat and presentation requests are serialized per learner in each server process. AI routes allow 12 requests per minute per IP; other API requests allow 120.

## Verification

```bash
npm run lint
npm run build
npm test
```

Tests cover API validation, cookie isolation and tampering, cross-origin writes, failed AI calls, Gemini payloads and structured responses using mocked provider HTTP, real-video filtering, graph consistency, note retrieval, recursive prerequisites, and PowerPoint ZIP/slide/note contents.

To run the **real Neo4j integration test**, first configure a local or dedicated test database, then:

```bash
RUN_NEO4J_TESTS=1 npm run test:integration
```

The integration test seeds the shared catalog, uses uniquely named test learners, and removes its learner-owned data afterward. It checks real persistence, profile relationships, ownership, history, reset, and deletion. It never calls Gemini. Live Gemini/YouTube requests require your credentials and provider quota and are not part of the default tests.

## Production

```bash
npm ci
npm run build
NODE_ENV=production APP_ORIGIN=https://your-domain.example HOST=0.0.0.0 npm start
```

The Node server serves `dist` and the API together. `npm start` runs the TypeScript server with the runtime dependency `tsx`. `npm run preview` serves only the frontend and is not a full-stack production server.

Terminate HTTPS at your reverse proxy, keep database ports private, and set a stable production `SESSION_SECRET`. Production cookies require HTTPS. All provider/database keys belong in server environment variables; never add a `VITE_` prefix. `.env` is ignored by Git. Origin checks and in-memory rate limits are included; a public multi-instance service would also need account authentication, shared rate limits, and shared request coordination. No paid services or external accounts are automatically provisioned.

Official integration references: [Gemini structured output](https://ai.google.dev/gemini-api/docs/structured-output), [Neo4j JavaScript queries](https://neo4j.com/docs/javascript-manual/current/query-simple/), [YouTube search API](https://developers.google.com/youtube/v3/docs/search/list), [PptxGenJS](https://gitbrent.github.io/PptxGenJS/docs/quick-start/).
