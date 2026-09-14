# CogniGraph - KTU CSE Second Brain

## Project Overview
CogniGraph is a Vite + React + TypeScript knowledge graph tool for KTU S3 Computer Science students. It organizes academic resources (notes, capsules, question papers, textbooks) into a searchable graph with concepts and prerequisites.

## Current Scope - KTU S3 CSE
**Courses:** Data Structures, Design and Engineering, Discrete Mathematical Structures, Logic System Design, Object Oriented Programming Using Java, OOP Lab, Sustainable Engineering

**Resources:** 44 items across textbooks, notes, capsules, assignments, programs, practice material, lab material, records, series and university question papers

**Concepts:** 15 nodes with prerequisite chains enabling knowledge path tracing

## Core Features
- **Knowledge Graph:** Force-directed canvas rendering of courses → concepts → resources
- **Semantic Search:** Token-based matching across titles, summaries, types, sources, course codes
- **Assistant Panel:** Natural-language queries with resource recommendations and prerequisite hints
- **Dashboard Stats:** Courses, concepts, resources, and graph link counts

## Data Model
- `Course`: subject code, name, semester (KTU S3)
- `Concept`: topic with prerequisite links forming knowledge paths
- `AcademicResource`: title, type, courseId, conceptIds, summary, source (Google Drive/OneDrive), url

## Search Behavior
Simple token matching across resource title, summary, type, source, course code/name/semester, and linked concept names. Queries like "KTU S3 OOP question papers" match resources even without exact phrase.

## Graph Relationships
- course → concept: `contains`
- prerequisite concept → concept: `prereq`  
- concept → resource: `supports`

## Commands
```bash
npm run dev    # development server
npm run lint   # lint check
npm run build  # build (may need outside sandbox on Windows)
```

## Extension Ideas (KTU CSE Focus)
- Subject filters and resource-type filters
- Module-level concepts per KTU subject
- File ingestion for PDFs/notes/question papers
- Graph zoom/pan and click-to-filter
- Local persistence for custom resources