# CogniGraph

KTU S3 CSE study workspace: React + TypeScript + Vite frontend, Express TypeScript backend, Gemini, and Neo4j. Read README.md for setup and architecture.

## Core data flow

`src/data/sampleKnowledgeBase.ts` seeds the shared 7-course, 15-concept, 44-resource catalog. `server/database.ts` persists courses, concepts, prerequisites, personal notes, learner profiles, and chat messages in Neo4j. Browser users are identified by signed HTTP-only cookies. Access to personal resources is always scoped by learner ID; shared seed resources are read-only through the API.

`server/retrieval.ts` ranks saved metadata/note text and expands prerequisite paths. `server/gemini.ts` sends that graph context, the learning profile and recent history to Gemini, validates structured output, and filters invented source IDs. It does not read linked files or execute model-generated Cypher. `server/youtube.ts` provides real video results when configured, otherwise explicitly labeled search links. `server/presentation.ts` renders validated Gemini outlines as editable PPTX downloads with speaker notes.

The frontend loads `/api/workspace`. Offline sample data is a visible catalog preview; AI and persistence must not silently fall back to fake success. Search and assistant drafts are independent. `KnowledgeService` handles local search, stats and namespaced graph construction, not AI responses.

## Commands

- `npm run dev`: frontend and backend together
- `npm run build`: type-check frontend and server, then bundle frontend
- `npm run lint`: Oxlint
- `npm test`: offline unit/API/provider-contract tests
- `RUN_NEO4J_TESTS=1 npm run test:integration`: real database test using .env
- `docker compose up -d`: local Neo4j
- `NODE_ENV=production npm start`: full-stack server serving dist (set APP_ORIGIN)

## Implementation requirements

- Keep all credentials server-side in ignored .env or deployment environment variables. Never use VITE_ for keys.
- Parameterize Cypher, validate API input, and enforce learner ownership in database queries.
- Treat saved notes as model context, not trusted instructions.
- Preserve explicit setup, loading, error, and YouTube fallback states.
- Namespace graph IDs by kind; concept/resource IDs overlap in the seed catalog.
- Test behavior across the API/database/provider boundaries. Default tests must not spend provider quota.
- The current identity model is browser-based, not account authentication. Do not imply cross-device access.
