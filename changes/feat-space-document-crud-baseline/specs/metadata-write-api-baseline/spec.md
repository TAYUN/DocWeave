# 能力规格

## ADDED Requirements

### Requirement: Space Creation API

The system SHALL allow creating a space through the business API.

#### Scenario: Create a new space

- **WHEN** a client sends `POST /api/spaces` with the required metadata
- **THEN** the API persists the space and returns the created record

### Requirement: Document Creation API

The system SHALL allow creating a document under a space through the business API.

#### Scenario: Create a document under a space

- **WHEN** a client sends `POST /api/documents` with `spaceId`, `title`, and initial summary
- **THEN** the API persists the document and returns the created record

### Requirement: Document Summary Update API

The system SHALL allow editing document metadata through the business API.

#### Scenario: Update document summary

- **WHEN** a client sends `PATCH /api/documents/:documentId`
- **THEN** the API updates the editable metadata fields and returns the saved document
