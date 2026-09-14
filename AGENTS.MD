# CogniGraph Agent Notes

## Project Summary

CogniGraph is a Vite + React + TypeScript demo for an agentic AI-powered second brain for university students. The current prototype is KTU-specific and demonstrates how semester resources can be organized into a searchable academic knowledge base and rendered as a knowledge graph.

The abstract behind the project positions CogniGraph as a unified academic knowledge ecosystem for course materials, lecture notes, lab manuals, previous year question papers, assignments, textbooks, and online learning content. The core idea is to reduce scattered-resource friction by combining natural-language retrieval with a structured graph of courses, concepts, resources, and prerequisites.

## Current Demo Scope

The current dataset targets KTU S3 Computer Science resources.

Subjects included:

- DS: Data Structures
- DE: Design and Engineering
- DMS: Discrete Mathematical Structures
- LSD: Logic System Design
- OOP: Object Oriented Programming Using Java
- OOP Lab: Object Oriented Programming Lab
- SE: Sustainable Engineering

Resource categories currently represented include textbooks, notes, capsule notes, assignments, programs, practice material, lab material, records, series question papers, university question papers, and shared extras. Most resources are external Google Drive or OneDrive links.

## Architecture

Important files:

- `src/domain/academic.ts`: shared domain types for courses, concepts, resources, graph nodes, and graph edges.
- `src/data/sampleKnowledgeBase.ts`: current KTU S3 demo dataset.
- `src/services/knowledgeService.ts`: search, answer generation, dashboard stats, and graph construction.
- `src/hooks/useKnowledgeBase.ts`: creates the knowledge service from the sample data.
- `src/components/KnowledgeGraph.tsx`: canvas-based graph renderer.
- `src/components/ResourceSearch.tsx`: searchable resource list with external open links.
- `src/components/AssistantPanel.tsx`: simple natural-language query/answer surface.
- `src/components/StatStrip.tsx`: dashboard summary cards.
- `src/App.css`: application layout and visual styling.

## Data Model

The knowledge base has three primary entities:

- `Course`: subject-level node with code, name, and semester.
- `Concept`: concept or grouping node attached to a course, with prerequisite concept IDs.
- `AcademicResource`: external or internal resource attached to a course and one or more concepts.

When extending data:

- Keep IDs stable, lowercase, and readable, such as `oop-university` or `dms-logic`.
- Add new resource types to `ResourceType` before using them in data.
- Every resource should include a title, type, courseId, conceptIds, summary, source, and url.
- Prefer grouping large resource folders as single resources instead of creating one node per file unless file-level metadata is available.
- Keep concept names student-facing and exam-useful, not overly abstract.

## Search Behavior

`KnowledgeService.search()` currently performs simple token-based matching across:

- resource title
- summary
- resource type
- source
- course code
- course name
- semester
- linked concept names

This means queries like `KTU S3 OOP question papers` can match resources even when the exact phrase is not present. If improving search later, preserve this forgiving behavior before adding semantic ranking, embeddings, or backend retrieval.

## Graph Behavior

The graph is rendered with a real HTML canvas, not SVG. `KnowledgeGraph.tsx` builds a deterministic force-style layout in the browser from the nodes and edges returned by `KnowledgeService.buildGraph()`.

Graph relationships:

- course -> concept: `contains`
- prerequisite concept -> concept: `prereq`
- concept -> resource: `supports`

Rendering notes:

- Course nodes are large and labeled.
- Concept and resource nodes are intentionally less verbose to avoid label crowding.
- Hover state shows node details through a tooltip.
- The current graph is suitable for a dense demo with 44 resources. For hundreds of resources, add filtering, zoom/pan, clustering, or virtualized rendering.

## UI Guidance

The app should feel like a practical student knowledge tool, not a marketing landing page. Keep the first screen focused on the usable experience: stats, graph, search, and assistant.

When extending UI:

- Keep controls compact and scan-friendly.
- Use existing CSS patterns and 8px border radii.
- Use `lucide-react` icons for buttons and visual affordances.
- Avoid decorative SVG graph illustrations; the graph should remain a real interactive/rendered visualization.
- Ensure text does not overlap inside cards, buttons, or the graph area on mobile.

## Commands

Development:

```bash
npm run dev
```

Checks:

```bash
npm run lint
npm run build
```

Note: on this Windows environment, `npm run build` may need to run outside the sandbox because Vite can hit `spawn EPERM` while loading config or spawning helper processes.

## Extension Ideas

Good next steps:

- Add subject filters and resource-type filters.
- Add module-level concepts for each KTU subject.
- Add file ingestion for PDFs, notes, and question papers.
- Add embeddings or semantic search over extracted document text.
- Add graph zoom/pan and click-to-filter behavior.
- Add local persistence or backend storage for custom resources.
- Add an admin/import screen for adding KTU links without editing TypeScript.
- Add provenance metadata such as year, module, exam type, and contributor.

## Current Verification Status

The current KTU integration was verified with:

- `npm run lint`
- `npm run build`
- Browser smoke test at `http://127.0.0.1:5173/`

The visible app shows 7 courses, 15 concepts, 44 resources, and 56 graph links.
