# 能力规格：collaboration-server-recovery-baseline

## ADDED Requirements

### Requirement: Collaboration Rooms Must Restore From Server-Owned Document Truth

The system SHALL restore a collaboration room from persisted server truth instead of relying on browser-local seed data as the primary source.

#### Scenario: `onLoadDocument` restores a missing in-memory room from persisted content

- **GIVEN** `apps/collab` receives a room connection for a document without an in-memory `Y.Doc`
- **WHEN** `onLoadDocument` runs
- **THEN** it reads the document's current persisted body from a server-owned runtime endpoint
- **AND** it reconstructs a `Y.Doc` from that persisted content
- **AND** the restored room remains bound to the same `documentId`

#### Scenario: Empty persisted content falls back to an empty collaboration document

- **GIVEN** the target document has no meaningful persisted body yet
- **WHEN** `onLoadDocument` restores the room
- **THEN** it returns an empty `Y.Doc`
- **AND** the browser may still use its existing empty-document fallback behavior without becoming the primary truth source

#### Scenario: Existing in-memory room is reused without redundant API reload

- **GIVEN** the target room already has a live in-memory `Y.Doc`
- **WHEN** another client joins the same room
- **THEN** `apps/collab` reuses that in-memory room
- **AND** it does not re-fetch persisted content for every join
