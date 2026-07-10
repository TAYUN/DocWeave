# 能力规格：document-snapshot-index-status-baseline

## ADDED Requirements

### Requirement: API Must Split Snapshot Creation, Index Triggering, And Status Query

The system SHALL expose separate API contracts for creating snapshots, triggering index jobs, and querying document processing status.

#### Scenario: Snapshot creation is an explicit server action

- **GIVEN** an authenticated user can edit a document
- **WHEN** the client calls `POST /api/documents/:documentId/snapshots`
- **THEN** the server creates one stable snapshot from the current persisted document body
- **AND** the response returns the created snapshot metadata together with the updated `latestSnapshotVersion`

#### Scenario: Index trigger targets a stable snapshot

- **GIVEN** a document has at least one stable snapshot
- **WHEN** the client calls `POST /api/documents/:documentId/index`
- **THEN** the request either targets the provided `snapshotVersion` or defaults to the document's current `latestSnapshotVersion`
- **AND** the response returns the created job metadata without waiting for background completion

#### Scenario: Status query returns snapshot and index truth together

- **GIVEN** a document has snapshot and index history
- **WHEN** the client calls `GET /api/documents/:documentId/status`
- **THEN** the response includes `latestSnapshotVersion`, `latestIndexedVersion`, the latest snapshot summary, and the latest relevant index job summary

#### Scenario: Status query prefers the newest non-superseded job summary

- **GIVEN** a document has multiple historical jobs including superseded ones
- **WHEN** the client calls `GET /api/documents/:documentId/status`
- **THEN** the status response prefers the newest job whose state is still relevant to the current document processing story
- **AND** older `superseded` jobs do not displace a newer active, failed, or succeeded job in the top-level status summary

### Requirement: Status Contracts Must Stay Focused On M4 Baseline Semantics

The system SHALL expose only snapshot and index baseline fields in this change and leave publish semantics separate.

#### Scenario: Publish state is not required for M4 baseline status

- **GIVEN** the system has not yet implemented document publishing
- **WHEN** the M4 status contract is returned
- **THEN** it does not claim that a document is published or searchable beyond the snapshot and index fields it actually owns

#### Scenario: Save, index, and publish remain distinct responsibilities

- **GIVEN** future work adds document publish semantics
- **WHEN** the client interacts with M4 baseline APIs
- **THEN** `POST /snapshots` means only “save stable snapshot”
- **AND** `POST /index` means only “enqueue snapshot indexing”
- **AND** publish behavior remains out of scope for this change

### Requirement: Package Boundaries Must Be Enforced By Contract

The system SHALL keep package responsibilities stable across `apps/api`, `apps/worker`, `packages/document`, and `packages/rag`.

#### Scenario: API owns records and orchestration

- **GIVEN** a snapshot or index job is created
- **WHEN** the operation begins in `apps/api`
- **THEN** `apps/api` owns HTTP validation, transactional row creation, and document status pointer updates
- **AND** it does not perform the long-running index pipeline inline in the request

#### Scenario: Worker owns async execution

- **GIVEN** an index job is pending
- **WHEN** the background worker picks it up
- **THEN** `apps/worker` owns claiming the job, calling the package boundaries, and persisting job progress

#### Scenario: Shared packages own document parsing and rag processing

- **GIVEN** a worker has loaded a target snapshot
- **WHEN** it needs to prepare searchable content
- **THEN** `packages/document` owns parsing and server-side document preprocessing from snapshot content
- **AND** `packages/rag` owns chunk construction, embedding orchestration, and vector-store publishing
