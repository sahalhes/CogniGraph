# CogniGraph — Master Content Brief for Presentation Creation

> Prepared from the project source, README, six supplied screenshots, and the sample GPU learning PPTX on 27 October 2026. This document is a content source for another AI model. It is not a fixed slide template. The user's later instructions determine the presentation format, slide count, audience, theme, and required sections.

## 1. Instructions to the PPT creator

Create a presentation about **CogniGraph** using this document as the factual source. Adapt the material to the format the user supplies later while keeping names, feature descriptions, metrics, and limitations consistent.

- Include all six repository screenshots: `PPT/1.png`, `PPT/2.png`, `PPT/3.png`, `PPT/4.png`, `PPT/5.png`, and `PPT/6.png`. There is no requested seventh screenshot. Use the asset descriptions in section 12 to place and caption them accurately.
- Include the existing generated sample presentation, `PPT/GPUs-and-Digital-Logic-From-Gates-to-Graphics.pptx`, as a project output/example. Explain how it connects GPU learning with digital logic and Logic System Design. Screenshot `2.png` shows this output.
- Use actual screenshots as evidence. Preserve aspect ratios and legibility; crop or enlarge details where helpful without hiding relevant context. Do not replace them with invented interfaces.
- Present implemented functionality separately from proposed improvements. Do not claim automatic document ingestion, vector search, account login, or measured learning gains.
- Use short slide bullets and put implementation detail in speaker notes or an appendix when the requested format allows it.
- Do not invent author names, team members, institution, guide, academic year, benchmarks, user counts, deployment URLs, or evaluation results. Use clearly marked placeholders if the later format requires missing information.
- The 4–12-slide limit described below belongs to CogniGraph's built-in study-deck generator. It does **not** restrict the project presentation you are creating.
- Keep the project presentation focused on CogniGraph. The GPU deck is an example of what CogniGraph produces, not the subject of the entire project presentation.

## 2. Project identity and concise descriptions

| Field | Canonical content |
| --- | --- |
| Project name | CogniGraph |
| Repository | https://github.com/sahalhes/CogniGraph |
| UI eyebrow | Your knowledge, connected. |
| UI tagline | A second brain for your next breakthrough. |
| Primary audience | KTU Semester 3 Computer Science and Engineering students |
| Product category | Personal study workspace with a knowledge graph and AI study assistant |
| Core technologies | React, TypeScript, Vite, Express, Neo4j, Gemini/OpenRouter, PptxGenJS |

**One-line pitch:** CogniGraph connects a student's courses, concepts, resources, and conversations in a personal study workspace that supports AI explanations, learning recommendations, and editable PowerPoint generation.

**Short abstract:** CogniGraph organizes KTU S3 CSE learning materials around a persistent Neo4j knowledge graph. Students can search a shared catalog, save personal links and notes, record their learning level and known concepts, and ask follow-up questions. The backend retrieves relevant resource metadata and pasted notes, expands prerequisite relationships, and supplies this context to a configured AI provider. The workspace also offers YouTube recommendations and downloadable study presentations. A visual graph exposes connections among courses, concepts, resources, and saved conversations.

## 3. Problem, motivation, and objectives

### Problem being addressed

Learning materials are often scattered across course folders, notes, question papers, and external links. A folder structure alone does not explain which concepts underpin a topic or which resources are relevant to a student's current question. Students also need a way to revisit discussions and convert study explanations into reusable revision material.

These are the project's motivating problems, not findings from a documented user study.

### Objectives

1. Bring course materials and personal study notes into one searchable workspace.
2. Represent relationships between courses, concepts, prerequisites, and resources.
3. Tailor AI explanations using the student's level, goal, known concepts, and recent conversation.
4. Recommend saved resources and optionally relevant YouTube tutorials.
5. Persist personal notes, profiles, and chat history in Neo4j.
6. Generate editable PowerPoint study aids from a topic and relevant graph context.
7. Make connection, configuration, loading, and failure states visible to the student.

### Intended value

The project provides a connected view of study materials and a path from asking a question to reviewing references and exporting teaching slides. Reduced search effort and improved learning are intended benefits; no quantitative improvement has been established in the repository.

## 4. Implemented scope and academic catalog

The shared seed catalog contains **7 courses, 15 concepts, and 44 resources**. These are initial catalog counts, not adoption or performance metrics. Personal additions and conversations change workspace counts and graph links.

| Course code | Course name |
| --- | --- |
| DS | Data Structures |
| DE | Design and Engineering |
| DMS | Discrete Mathematical Structures |
| LSD | Logic System Design |
| OOP | Object Oriented Programming Using Java |
| OOP Lab | Object Oriented Programming Lab |
| SE | Sustainable Engineering |

### Seed concepts

- **DS:** Linear and non-linear structures; DS exam practice; Shared KTU reference shelf.
- **DE:** Engineering design process; DE exam practice.
- **DMS:** Logic, sets, relations and graphs; DMS exam practice.
- **LSD:** Digital logic and sequential circuits; LSD exam practice.
- **OOP:** Java OOP foundations; OOP module notes; Java practice and important questions.
- **OOP Lab:** OOP lab cycle and records.
- **SE:** Sustainability concepts; SE exam practice.

### Resource coverage

The catalog includes textbook links, class notes, capsule revision material, assignments, programs, series and university question papers, Java module notes and practice, lab records and exercises, and supplementary references. Supported resource types are `notes`, `lab`, `paper`, `assignment`, `textbook`, `capsule`, `program`, `practice`, `record`, and `extras`.

Seed sources include Google Drive and a shared OneDrive/OneNote reference. A saved link stores metadata; it does not mean the linked file or folder has been read by the AI.

### Existing prerequisite examples

- Logic, sets, relations and graphs → Digital logic and sequential circuits → LSD exam practice.
- Linear and non-linear structures → Java OOP foundations → OOP module notes / Java practice / OOP lab cycle.
- Course foundations → the corresponding exam-practice concept.

GPU is a teaching topic in the supplied demonstration, not a separate seeded course or concept node.

## 5. User-facing features

| Feature | Implemented behavior | Presentation value |
| --- | --- | --- |
| Dashboard | Shows course, concept, resource, and graph-link counts plus connection/provider status | Introduces the workspace at a glance |
| Learning profile | Saves beginner/intermediate/advanced level, learning goal, and known concepts | Supplies personalization context |
| Interactive graph | Canvas graph with zoom, pan, node dragging, search, fit, focus, type filters, and node details | Makes relationships visible |
| Resource search | Searches resource metadata, pasted content, source, course, and concept names | Helps locate study material |
| Add material | Saves a personal HTTP/HTTPS link and/or pasted notes with course, concepts, and summary | Extends the shared catalog with personal material |
| Delete material | Removes learner-owned materials; shared seed resources remain read-only through the API | Preserves catalog integrity |
| AI chat | Uses relevant saved context, prerequisites, profile, and recent messages; renders explanations and resource cards | Supports contextual follow-up learning |
| Conversation graph nodes | Shows saved user questions and links them to cited resources and related concepts | Connects study discussions with the catalog |
| YouTube recommendations | Optional real video search when configured; explicit search-link fallback otherwise | Adds another learning medium |
| Create PPT | Generates a validated outline and downloads a real editable PPTX | Converts a topic into a reusable study aid |
| Persistence | Saves notes, profile, and conversations in Neo4j per browser learner | Allows continuity in the same browser identity |
| Clear chat | Clears conversation without deleting profile or saved material | Separates conversation cleanup from study content |
| Catalog preview | Displays sample catalog if the database is unavailable, with AI and writes disabled | Provides an honest offline preview |

Search input and assistant drafts are independent. Provider configuration indicators describe setup; they do not guarantee a successful AI response.

## 6. Typical learning workflow

1. Open the workspace and check the database and AI configuration indicators.
2. Save a profile with experience level, learning goal, and known concepts.
3. Explore the graph or search the existing catalog.
4. Add personal materials or paste actual notes when their contents should inform the tutor.
5. Ask a question in Chat; optionally enable Include YouTube.
6. Read the explanation, follow saved-resource references, and ask follow-up questions.
7. Explore the conversation's connections in the graph.
8. Select Create PPT, enter a study topic, choose 4–12 slides, and download the editable presentation.

Personal identity uses a signed HTTP-only browser cookie. This is not account authentication or cross-device synchronization. Clearing that cookie or changing the session secret loses access through the prior browser identity.

## 7. System architecture and data flow

### Architecture overview

```text
Student browser
  React + TypeScript UI
  Profile | Graph | Resources | Chat | Create PPT
                       |
                 HTTP /api requests
                       v
  Express + TypeScript backend
  Session cookie | validation | origin checks | rate limits
       |                    |                     |
       v                    v                     v
     Neo4j             AI integration         YouTube API
  Catalog/profile/     Gemini or OpenRouter    Optional search
  notes/messages       Structured responses    Labeled fallback
       |                    |
       +--> relevant graph context --> validated slide outline
                                             |
                                         PptxGenJS
                                             |
                                      Editable .pptx download
```

### Chat data flow

1. The browser submits a question and the Include YouTube setting.
2. The server identifies the learner from the signed cookie and loads the permitted workspace.
3. Lexical retrieval ranks resources using the question plus the two most recent user messages.
4. The server expands prerequisites for retrieved concepts and includes profile data and known-concept flags.
5. The AI provider receives this context and recent chat history.
6. Structured output is validated; returned source IDs are filtered to retrieved resources.
7. Optional YouTube search produces actual video links or a labeled search fallback.
8. A completed chat turn is persisted and displayed; saved questions also appear in the frontend graph.

### Presentation data flow

Topic + requested slide count → relevant graph context → AI-generated structured outline → validation → PptxGenJS rendering → downloadable PPTX with speaker notes and saved-reference citations.

The slide-generation request uses topic retrieval and the learner profile. Do not claim it receives the same recent-chat history payload as the chat route.

## 8. Knowledge graph and retrieval details

### Persistent Neo4j model

```text
(Course)-[:CONTAINS]->(Concept)
(Concept)-[:PREREQUISITE_OF]->(Concept)
(Course)-[:HAS_RESOURCE]->(Resource)
(Concept)-[:SUPPORTS]->(Resource)
(Learner)-[:KNOWS]->(Concept)
(Learner)-[:SAVED]->(Resource)
(Learner)-[:SENT]->(Message)
```

Course, concept, resource, learner, and message records serve different roles. Learner-owned material is isolated from other learners. Initialization creates constraints and seeds the shared catalog idempotently.

The frontend builds a visualization from workspace data. It uses namespaced IDs such as `course:…`, `concept:…`, `resource:…`, and `conversation:…`. This prevents collisions where raw IDs overlap. Conversation-to-resource and conversation-to-concept edges are constructed for display from user messages, adjacent assistant references, and concept matches. Do not describe every visible frontend edge as an independently persisted Neo4j relationship.

### Retrieval algorithm

- Tokenizes the query, removes common stop words, and deduplicates terms.
- Gives a matching title/course/concept term weight 3 and a matching summary/content/type term weight 1.
- Keeps positive-scoring resources, sorts by score, and returns at most 10.
- Recursively traverses prerequisite concepts with cycle protection.
- Includes up to 8,000 characters of content per retrieved resource in graph context.
- Chat includes up to 16 recent messages, each truncated to 10,000 characters.

This is **graph-grounded lexical retrieval**, not embedding/vector search. The graph context is assembled by server code; the AI does not execute generated Cypher. General teaching knowledge is allowed, with instructions to distinguish it from saved material.

## 9. AI providers and PowerPoint generation

### Provider support

- Supports Gemini through the Google Gen AI SDK and OpenRouter through its chat-completions API.
- `AI_PROVIDER` selects `gemini` or `openrouter`; if absent, an OpenRouter key selects OpenRouter, otherwise Gemini.
- OpenRouter accepts `openrouter/free` or explicit model IDs ending in `:free`; paid model IDs are rejected by this integration.
- Gemini can use a configured fallback model for temporary availability failures. If an OpenRouter key is configured, eligible Gemini/provider failures can fall back to OpenRouter.
- Responses are schema-validated, with a corrective retry for malformed output.
- API keys remain on the server. Provider limits and availability still apply.
- Model choice is configurable. Screenshots show OpenRouter with `openrouter/free`; do not call that the only supported model or infer which model generated the sample file.

### Built-in study-deck output

- Input: a topic and an integer slide count from 4 to 12; API default is 7.
- AI outline: deck title; slide titles; 1–5 concise bullets per slide; speaker notes; up to 4 resource IDs per slide.
- Renderer: PptxGenJS, editable text, widescreen layout, slide numbers, speaker notes, and saved references in notes.
- Style: Aptos/Aptos Display, dark green first-slide background, light later slides, orange left accent, CogniGraph study-notes branding.
- Footer: “AI-generated study aid · Verify against your syllabus”.
- Rendering does not fetch remote files or automatically embed screenshots/images.

The request to include repository screenshots applies to the **project presentation made from this brief**. It is not a claim that the app's built-in generator already adds screenshots automatically.

## 10. GPU learning example and supplied sample PPT

**Required artifact:** [GPUs-and-Digital-Logic-From-Gates-to-Graphics.pptx](./GPUs-and-Digital-Logic-From-Gates-to-Graphics.pptx)

This existing four-slide study deck demonstrates connecting an advanced interest—GPUs—to digital logic foundations relevant to the LSD course. It is a tangible example of the presentation-generation feature.

### Verified slide titles and themes

| Sample slide | Exact title | Main teaching connection |
| --- | --- | --- |
| 1 | Introduction to GPUs and Digital Logic | Introduces GPUs, binary processing, logic gates, Boolean algebra, and combinational/sequential prerequisites |
| 2 | GPU Architecture and Parallel Processing | Relates parallel computation and memory hierarchy to ALUs, gates, and control circuitry |
| 3 | Digital Logic Building Blocks in GPUs | Connects adders/multiplexers to ALUs, flip-flops to registers, clocks to synchronization, and state machines to control |
| 4 | Recap and Applications | Revisits the hardware foundation and applications in graphics, machine learning, and scientific computing |

### Recommended project-presentation explanation

“CogniGraph can connect a student's interest in GPUs with familiar Logic System Design concepts. The supplied four-slide output moves from GPU fundamentals to the digital circuits that support computation, then finishes with applications. This shows how a learning topic can become an editable study presentation.”

Suggested conceptual teaching path: **Boolean algebra and gates → combinational/sequential circuits → ALUs, registers, and control → GPU computation and applications.** This path is an explanation of the demo, not a claim that every step exists as a separate stored graph node.

Use `PPT/2.png` as the sample-output image. It shows slide 3, “Digital Logic Building Blocks in GPUs,” in a presentation editor with a four-slide thumbnail panel. Mention or link the actual PPTX in supporting material when the requested output format permits it.

The sample is AI-generated educational material, not a verified hardware specification. If expanding its teaching content, avoid universal claims about GPU core counts, SIMD/SIMT execution, or clock domains; these depend on architecture. Do not treat the sample as a source for precise hardware benchmarks.

## 11. Technology, modules, API, and operation

### Stack responsibilities

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite | Workspace UI and client build |
| Graph UI | HTML canvas and custom force simulation | Interactive graph rendering |
| UI support | Lucide React, React Markdown | Icons and formatted assistant text |
| Backend | Express 5, TypeScript, tsx | API and runtime |
| Persistence | Neo4j and neo4j-driver | Catalog and learner data |
| AI | Google Gen AI SDK / OpenRouter HTTP API | Explanations and structured slide outlines |
| Validation | Zod | Input/output schemas |
| Presentation export | PptxGenJS | Editable PowerPoint file creation |
| Video search | YouTube Data API v3 | Optional individual video results |
| Local database | Docker Compose, Neo4j 5.26 Community | Persistent local graph database |
| Verification | Node test runner via tsx, TypeScript, Oxlint | Tests, type checks, lint |

### Source map

| Path | Responsibility |
| --- | --- |
| `src/App.tsx` | Workspace layout and feature composition |
| `src/components/KnowledgeGraph.tsx` | Graph simulation, rendering, and interaction |
| `src/components/AssistantPanel.tsx` | Chat and PPT controls |
| `src/components/LearningProfile.tsx` | Profile editing |
| `src/components/AddResource.tsx` | Personal-material form |
| `src/components/ResourceSearch.tsx` | Search and resource cards |
| `src/components/StatStrip.tsx` | Dashboard metrics |
| `src/hooks/useKnowledgeBase.ts` | Workspace loading and connection state |
| `src/services/api.ts` | Frontend API access |
| `src/services/knowledgeService.ts` | Local search, statistics, and display graph construction |
| `src/domain/` | Academic, profile, workspace, and message types |
| `src/data/sampleKnowledgeBase.ts` | Shared seed catalog and preview data |
| `server/app.ts` | API routes, sessions, origin checks, rate limits |
| `server/database.ts` | Persistence, seeding, profile/history, ownership checks |
| `server/retrieval.ts` | Resource ranking and prerequisite expansion |
| `server/gemini.ts` | Both AI providers, structured output, and generation |
| `server/presentation.ts` | PPTX rendering |
| `server/youtube.ts` | Video search, cache, fallback |
| `server/validation.ts` | Schemas and API error type |
| `server/config.ts`, `server/index.ts` | Environment configuration and server startup |
| `tests/` | Unit, API, provider-contract, and Neo4j integration coverage |

### API reference

| Method and endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Database connectivity and provider configuration flags |
| `GET /api/workspace` | Catalog, personal resources, profile, latest 40 messages |
| `PUT /api/profile` | Save profile and known concepts |
| `POST /api/resources` | Create personal material |
| `DELETE /api/resources/:id` | Delete an owned resource |
| `POST /api/chat` | Generate a reply and persist a completed turn |
| `DELETE /api/chat` | Clear conversation |
| `POST /api/presentations` | Generate and download PPTX |

### Setup and deployment

Requires Node.js 22.12+ and a reachable Neo4j 5.26+ instance, local or hosted. Install dependencies, copy `.env.example` to `.env` if needed, configure database credentials, a stable session secret, and an AI key. YouTube configuration is optional.

```bash
npm install
# Configure .env from .env.example; never overwrite existing secrets blindly.
docker compose up -d
npm run dev
```

Development frontend: `http://localhost:5173`; API: `127.0.0.1:3001`; Neo4j Browser: `http://localhost:7474`. Vite proxies `/api`. Docker's named `neo4j_data` volume preserves database data.

Relevant environment variable names: `AI_PROVIDER`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`, `NEO4J_URI`, `NEO4J_USERNAME`, `NEO4J_PASSWORD`, `NEO4J_DATABASE`, `SESSION_SECRET`, `YOUTUBE_API_KEY`, `APP_ORIGIN`, `HOST`, `PORT`, and `NODE_ENV`. Never put actual secret values in slides or use `VITE_` for credentials.

Production uses `npm run build` followed by `NODE_ENV=production npm start`, with the public `APP_ORIGIN`, appropriate host binding, HTTPS reverse proxy, and private database access. The Node server serves the built frontend and API together. `npm run preview` is frontend-only. No live production deployment is established by this brief.

## 12. Required screenshot asset manifest

Repository root: https://github.com/sahalhes/CogniGraph

Paths below are relative to the repository root; the Markdown links are relative to this file inside `PPT/`. Use the files from the checkout or the matching GitHub revision. Their availability on a remote branch must be checked if working without the local repository.

| Asset | Observed content | Suggested placement | Suggested caption |
| --- | --- | --- | --- |
| [PPT/1.png](./1.png) | CogniGraph dashboard, 7/15/44 catalog counts, connected status, conversation nodes, and a GPU-related assistant explanation | Product overview or GPU-learning demonstration | “A connected study workspace combining the knowledge graph and AI explanations.” |
| [PPT/2.png](./2.png) | Presentation editor displaying sample slide 3, “Digital Logic Building Blocks in GPUs,” with four slide thumbnails | PPT-generation output / GPU example | “Generated study presentation connecting GPU hardware with digital logic foundations.” |
| [PPT/3.png](./3.png) | Expanded beginner learning profile with CPU-learning goal, graph, saved-resource references, YouTube section, and an in-progress follow-up question | Personalization and learning workflow | “Learner context, saved references, and follow-up questions in one workspace.” |
| [PPT/4.png](./4.png) | Focused purple conversation node for “what is bus systems,” highlighted connections, inspector, profile, and tutorial cards | Graph interaction and conversation connections | “A selected conversation reveals its connected concepts and resources.” |
| [PPT/5.png](./5.png) | Neo4j Browser visualization centered on a Learner with SENT edges to message nodes; learner properties visible | Database model and persistence | “Neo4j stores learner information and relationships to saved messages.” |
| [PPT/6.png](./6.png) | Neo4j Browser message inspection showing stored message payload and sequence property | Persistent chat history / implementation evidence | “Stored message payloads demonstrate database-backed conversation history.” |

### Screenshot handling requirements

1. Include all six images meaningfully. Use separate slides or grouped layouts according to the later format, keeping each image readable.
2. UI screenshots use dark green/olive tones, muted light text, and purple conversation nodes. A matching project-deck theme is optional unless the user requests it.
3. Graph-link counts vary across screenshots (for example, 79, 83, and 93) as displayed workspace state changes. Do not present one as a permanent catalog total.
4. Screenshots 5 and 6 show the same learner-to-message structure with different selected-node details. Do not infer a new Message-to-Message `SENT` schema from screenshot 6.
5. No screenshot specifically documents the Add material form. Describe that feature from code, without claiming a supplied image shows it.
6. Screenshots record captured states. They do not prove current provider availability, a public deployment, or measured scalability.

## 13. Security, privacy, and reliability

- Signed HTTP-only cookies establish browser learner identity; the server does not trust a caller-supplied learner ID.
- Database queries are parameterized and enforce resource ownership.
- Personal notes, profiles, and messages are scoped to the learner; shared seed resources are read-only through the API.
- Input schemas bound text sizes and validate identifiers and URLs; AI responses are also validated.
- Saved notes are treated as context data, not trusted system instructions.
- Invented source IDs are filtered; linked resource cards come from retrieved catalog entries.
- Write requests require JSON content type and matching configured browser origin.
- AI routes are limited to 12 requests per minute per IP; other API routes to 120.
- Chat and PPT requests are serialized per learner within each server process.
- YouTube caches successful searches for 15 minutes with a bounded cache; missing keys, failures, empty results, and quota issues have labeled search-link fallbacks.
- Database outages show catalog preview and disable writes/AI rather than returning simulated success.
- Provider errors are displayed. A configured key is not proof of valid access or remaining quota.
- Relevant notes, profile/goal, and conversation context are sent to the selected external AI provider. Do not describe the system as fully local or offline AI.

## 14. Verification and evidence boundaries

The repository defines these checks:

```bash
npm run lint
npm run build
npm test
RUN_NEO4J_TESTS=1 npm run test:integration
```

Tests cover API validation, cookies and learner isolation, cookie tampering, origin checks, failed provider requests, mocked provider contracts and structured responses, source filtering, real-video filtering, graph consistency, note retrieval, recursive prerequisites, and PPTX ZIP/slide/note contents. The opt-in real Neo4j test checks persistence, ownership, profiles, history, reset, and deletion using test learners, then cleans up its learner data.

Default tests do not spend provider quota. Live provider calls require credentials and quota. **These are descriptions of repository verification coverage; no test run or fresh runtime evaluation was performed to create this documentation.** Do not invent pass counts, latency, retrieval accuracy, or educational-effectiveness scores.

Evidence available for the project presentation: source code, README, six screenshots, and an existing four-slide generated study deck.

## 15. Limitations and proposed future work

### Current limitations

- Academic seed scope is KTU S3 CSE; broader curricula are not supplied.
- Retrieval is lexical and depends on saved metadata, summaries, and pasted note text.
- The app does not automatically ingest linked PDFs, cloud folders/files, or YouTube transcripts.
- No embedding/vector search is implemented.
- Browser identity is not account login or cross-device synchronization.
- Provider/network access, keys, and quotas affect AI/video availability.
- Graph relationships and context guide generation but do not eliminate model errors.
- Built-in deck output uses a fixed text-oriented renderer; it does not automatically create diagrams or embed remote images.
- Rate limiting and request coordination are in-memory/per-process; a public multi-instance deployment needs additional infrastructure.
- No measured learning outcomes, production-scale benchmarks, or formal user-study results are documented here.

### Future improvements — proposed, not implemented

- Account authentication and cross-device workspaces.
- Authorized document ingestion, parsing, and transcript support.
- Embedding search or hybrid lexical/vector/graph retrieval.
- More courses, semesters, and richer prerequisite modeling.
- Quizzes, progress tracking, spaced repetition, and learning-path evaluation.
- Richer presentation templates, diagrams, and user-selected images.
- Shared infrastructure for distributed rate limits and coordination.
- User studies and retrieval/answer-quality evaluation.

## 16. Flexible presentation content map

Use these content blocks in the user's later required format. They are not mandatory slide numbers.

| Content block | Main point | Evidence / visual |
| --- | --- | --- |
| Title and introduction | CogniGraph is a connected personal study workspace | Project name and tagline |
| Problem and objectives | Scattered materials need context and relationships | Sections 3–4 |
| Scope | 7 courses, 15 concepts, 44 initial resources | Catalog table and screenshot 1 |
| Product overview | Profile, graph, search, chat, and export work together | Screenshot 1 |
| Personalized workflow | Goals and known concepts inform explanations | Screenshot 3 |
| Graph model and interaction | Prerequisites and conversations connect study material | Schema and screenshot 4 |
| Architecture | React UI, Express API, Neo4j, AI providers, export | Section 7 diagram |
| Retrieval and generation | Ranked saved context plus prerequisite expansion | Section 8 pipeline |
| Persistence | Learner profiles and messages are stored in Neo4j | Screenshots 5 and 6 |
| GPU learning output | Digital logic connects to GPU architecture in a generated deck | Screenshot 2 and sample PPTX |
| Reliability and validation | Boundaries, ownership, and explicit failure states | Sections 13–14 |
| Limitations and future work | Describe current limits and next steps honestly | Section 15 |
| Closing / Q&A | Connected materials → contextual learning → reusable study slides | Concise project takeaway |

If the required format has few slides, combine related blocks and use speaker notes for detail while retaining all six screenshots at readable sizes. If it has a technical appendix, put API, configuration, schemas, and module paths there.

## 17. Copy-ready handoff prompt for another AI

> Create a project presentation about CogniGraph using `PPT/PPT.md` as the factual content brief. Follow the slide format, audience, slide count, theme, and output requirements I provide next. Keep terminology and metrics consistent with the brief. Include all six repository screenshots, `PPT/1.png` through `PPT/6.png`, with accurate captions and readable layouts. Include the existing sample `PPT/GPUs-and-Digital-Logic-From-Gates-to-Graphics.pptx` as an output demonstration and explain its GPU-learning connection to digital logic/Logic System Design; use `PPT/2.png` to show that output. Distinguish implemented functionality, demonstrated evidence, limitations, and proposed future work. Do not invent features, benchmarks, academic details, or deployment claims. Put extensive detail in speaker notes or an appendix where permitted. The built-in generator's 4–12-slide limit does not constrain this project presentation. My required presentation format follows: [INSERT FORMAT HERE].

## 18. Local factual sources

- `README.md` — setup, functionality, architecture, APIs, identity, operation, and limitations.
- `AGENTS.MD` — implementation requirements and data-flow boundaries.
- `package.json` and `.env.example` — stack, commands, configuration names.
- `src/data/sampleKnowledgeBase.ts` — academic catalog and prerequisite definitions.
- `src/App.tsx`, `src/components/`, `src/services/knowledgeService.ts` — actual UI features and display graph behavior.
- `server/retrieval.ts`, `server/gemini.ts`, `server/presentation.ts`, `server/youtube.ts`, `server/validation.ts`, `server/database.ts`, `server/app.ts` — retrieval, providers, export, persistence, and API implementation.
- `tests/` — defined verification coverage.
- `PPT/1.png`–`PPT/6.png` — supplied screenshot evidence.
- `PPT/GPUs-and-Digital-Logic-From-Gates-to-Graphics.pptx` — verified four-slide example output.

Recheck these sources if implementation changes before the final presentation is generated.
