# 能力规格

## ADDED Requirements

### Requirement: Create Space Form Flow

The system SHALL provide a space creation form in the web workspace shell.

#### Scenario: Submit a new space

- **WHEN** a user fills in the create-space form and submits it
- **THEN** the UI calls the API, shows the result, and refreshes the visible space list

### Requirement: Create Document Form Flow

The system SHALL provide a document creation form tied to the current metadata shell.

#### Scenario: Submit a new document

- **WHEN** a user fills in the create-document form and submits it
- **THEN** the UI creates the document and makes it reachable from the workspace navigation

### Requirement: Metadata Write Feedback

The system SHALL provide minimal write-state feedback for the current CRUD flow.

#### Scenario: Surface a failed mutation

- **WHEN** a write request fails
- **THEN** the UI shows a clear failure state instead of silently staying stale
