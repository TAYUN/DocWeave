# 能力规格

## ADDED Requirements

### Requirement: Routed Web Workspace Shell

The system SHALL provide a routed workspace shell in `apps/web` using `TanStack Router`.

#### Scenario: Open the workspace overview

- **WHEN** a developer starts `apps/web` and opens the root path
- **THEN** the application renders an overview page instead of the default Vite demo page

#### Scenario: Navigate to seeded document details

- **WHEN** a developer navigates to `/documents/:documentId`
- **THEN** the route resolves through the router and renders a document-specific detail view

### Requirement: Query-Driven Metadata Fetching

The system SHALL fetch workspace metadata through `TanStack Query` instead of relying on hard-coded page-local demo state.

#### Scenario: Load spaces from the API

- **WHEN** the overview page requests workspace spaces
- **THEN** the client loads them from `/api/spaces`

#### Scenario: Load document details from the API

- **WHEN** the document page requests a document by id
- **THEN** the client loads it from `/api/documents/:documentId`

### Requirement: Space-Level Navigation

The system SHALL provide navigable space views in the web shell.

#### Scenario: Open a space route

- **WHEN** a developer opens `/spaces/:spaceId`
- **THEN** the page shows the selected space and its associated documents
