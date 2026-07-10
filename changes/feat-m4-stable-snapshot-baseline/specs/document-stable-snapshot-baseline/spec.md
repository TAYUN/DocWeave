# 能力规格：document-stable-snapshot-baseline

## ADDED Requirements

### Requirement: Stable Snapshots Must Be Persisted As The Server Truth For Versioned Content

The system SHALL persist stable document snapshots in `document_snapshots` and treat them as the versioned truth for downstream indexing and recovery workflows.

#### Scenario: Snapshot row stores the minimum stable truth

- **GIVEN** a document already exists in `documents`
- **WHEN** the system creates a stable snapshot
- **THEN** it stores one `document_snapshots` row containing `documentId`, `version`, `content`, `contentFormat`, `sourceDocumentUpdatedAt`, and `createdAt`
- **AND** the `content` value is the same serialized BlockNote JSON string shape currently stored in `documents.content`
- **AND** `contentFormat` is fixed to the explicit server value for BlockNote JSON snapshots

#### Scenario: Snapshot row can be traced back to its source document state

- **GIVEN** a snapshot was created from the current `documents.content`
- **WHEN** later services inspect that snapshot
- **THEN** they can identify which document row it belongs to and which document update timestamp it was derived from
- **AND** they do not need to read the live collaboration memory state to interpret the snapshot body

### Requirement: Snapshot Versions Must Be Monotonic Per Document

The system SHALL assign `snapshotVersion` as a monotonic integer sequence per `documentId`.

#### Scenario: First snapshot starts at version one

- **GIVEN** a document has no prior snapshot
- **WHEN** the first stable snapshot is created
- **THEN** the system stores it with `version = 1`

#### Scenario: Later snapshots increment by one for the same document

- **GIVEN** a document already has snapshot version `N`
- **WHEN** a newer stable snapshot is created for that same document
- **THEN** the new row uses `version = N + 1`
- **AND** versions from other documents do not affect that sequence

#### Scenario: Duplicate document-version pairs are rejected

- **GIVEN** `document_snapshots` already contains `(documentId = D, version = N)`
- **WHEN** another write attempts to create the same `(D, N)` pair
- **THEN** the persistence layer rejects the duplicate with a unique-key violation or equivalent transactional failure

### Requirement: Creating A Snapshot Must Atomically Advance Document Snapshot Status

The system SHALL update `documents.latestSnapshotVersion` only in the same transaction that commits the new snapshot row.

#### Scenario: Successful snapshot creation updates the document pointer

- **GIVEN** a snapshot creation request succeeds
- **WHEN** the transaction commits
- **THEN** `documents.latestSnapshotVersion` is updated to the newly created snapshot version
- **AND** the returned API payload exposes the same version value

#### Scenario: Failed snapshot creation leaves the document pointer unchanged

- **GIVEN** snapshot creation fails before commit
- **WHEN** the transaction rolls back
- **THEN** no new snapshot row is visible
- **AND** `documents.latestSnapshotVersion` remains at its previous value

### Requirement: Explicit Snapshot Creation Must Not Inflate Versions When Content Has Not Changed

The system SHALL treat `POST /snapshots` as idempotent against the current persisted document truth.

#### Scenario: Repeating snapshot creation without document changes reuses the latest snapshot

- **GIVEN** the latest snapshot for a document was created from the current `documents.content`
- **AND** the document has not changed since that snapshot source state
- **WHEN** the client calls `POST /api/documents/:documentId/snapshots` again
- **THEN** the system returns the existing latest snapshot metadata
- **AND** it does not create a new `document_snapshots` row
- **AND** `documents.latestSnapshotVersion` does not increment

#### Scenario: Snapshot version only advances after persisted document truth changes

- **GIVEN** the document body in `documents.content` has changed since the latest snapshot source state
- **WHEN** the client calls `POST /api/documents/:documentId/snapshots`
- **THEN** the system creates a new snapshot row
- **AND** the new row uses the next monotonic snapshot version for that document

### Requirement: M4 Snapshot Baseline Must Stay Independent From Collaboration Runtime Persistence

The system SHALL define the stable snapshot truth without requiring `apps/collab` to own snapshot creation in this change.

#### Scenario: Snapshot baseline reads current document body from API truth

- **GIVEN** M4 baseline is implemented before collaboration persistence is complete
- **WHEN** the user explicitly requests a snapshot
- **THEN** the API creates the snapshot from the current persisted `documents.content`
- **AND** it does not require `onLoadDocument` or `onStoreDocument` to be implemented in `apps/collab`

#### Scenario: Collaboration persistence remains a separate follow-up concern

- **GIVEN** future work needs to restore Yjs state or auto-persist collaboration updates
- **WHEN** that work is planned
- **THEN** it extends the snapshot baseline by feeding better content into it
- **AND** it does not redefine `document_snapshots` field semantics or version rules
