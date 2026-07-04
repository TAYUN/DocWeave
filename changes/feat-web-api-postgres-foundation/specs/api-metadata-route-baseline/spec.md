# 能力规格

## ADDED Requirements

### Requirement: Phase-1 Metadata API Baseline

The system SHALL provide the approved phase-1 metadata-oriented HTTP route baseline in `apps/api`.

#### Scenario: List spaces

- **WHEN** a client requests `GET /api/spaces`
- **THEN** the API returns a structured list of spaces

#### Scenario: Read a document

- **WHEN** a client requests `GET /api/documents/:documentId`
- **THEN** the API returns the document metadata for that id or a not-found response

#### Scenario: Update a document stub

- **WHEN** a client sends `PATCH /api/documents/:documentId`
- **THEN** the API accepts title/summary updates through the document service boundary

### Requirement: Boundary-Aligned Route Grouping

The system SHALL keep authentication, metadata, collaboration, AI, and RAG entrypoints separated through explicit route paths and controller modules.

#### Scenario: Inspect API route structure

- **WHEN** a developer reviews the Adonis route file and controllers
- **THEN** the code clearly separates `auth`, `spaces`, `documents`, `collaboration`, `ai`, and `rag` entrypoints
