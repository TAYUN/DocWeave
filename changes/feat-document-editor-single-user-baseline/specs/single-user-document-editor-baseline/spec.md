# 能力规格

## ADDED Requirements

### Requirement: Single-User Editor in Document Page

The system SHALL render a single-user document editor on the document page.

#### Scenario: Open a document page

- **WHEN** a user navigates to a document route
- **THEN** the page renders a real editor surface instead of metadata-only placeholder content

### Requirement: Document Content Load

The system SHALL load the current document content into the editor.

#### Scenario: Initialize editor content

- **WHEN** the document page loads
- **THEN** the editor receives the persisted content for the selected document

### Requirement: Document Content Save

The system SHALL persist edited document content through the current API boundary.

#### Scenario: Save edited content

- **WHEN** a user edits the document and triggers save behavior
- **THEN** the updated content is persisted and can be reloaded on refresh
