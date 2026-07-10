# 能力规格：rag-index-job-baseline

## ADDED Requirements

### Requirement: Index Jobs Must Bind To A Specific Snapshot Version

The system SHALL persist each index job in `rag_index_jobs` against one explicit `targetSnapshotVersion`.

#### Scenario: Triggering an index job records version-bound input

- **GIVEN** a document has an existing stable snapshot version
- **WHEN** the API creates an index job
- **THEN** the job row stores `documentId`, `targetSnapshotVersion`, `status`, `stage`, `requestedByUserId`, `attemptCount`, `errorCode`, `errorMessage`, `lockedAt`, `startedAt`, `finishedAt`, and `createdAt`
- **AND** the worker can execute the job without consulting browser-local state

#### Scenario: Missing target snapshot is rejected

- **GIVEN** the requested snapshot version does not exist for the target document
- **WHEN** the API attempts to create an index job
- **THEN** the request fails with a not-found or validation error
- **AND** no job row is created

### Requirement: Index Jobs Must Expose A Stable Lifecycle

The system SHALL use explicit status and stage fields so index progress can be queried and reasoned about.

#### Scenario: Job lifecycle progresses through stable statuses

- **GIVEN** a new index job is created
- **WHEN** it moves through the worker pipeline
- **THEN** its `status` moves through the allowed states `pending`, `running`, `succeeded`, `failed`, `superseded`, or `canceled`
- **AND** its `stage` reports the current lifecycle point such as `queued`, `preprocessing`, `chunking`, `embedding`, `upserting`, or `publishing`

#### Scenario: Failure keeps the reason on the job record

- **GIVEN** a worker step fails
- **WHEN** the job is marked failed
- **THEN** the row stores a machine-usable `errorCode`
- **AND** it may also store a human-readable `errorMessage`

### Requirement: Newer Snapshot Jobs Must Prevent Older Jobs From Publishing Stale Versions

The system SHALL prevent an older snapshot job from replacing the visible indexed version after a newer job has already won.

#### Scenario: New pending jobs supersede older pending jobs for the same document

- **GIVEN** a document already has one or more `pending` index jobs for lower snapshot versions
- **WHEN** a newer snapshot version is queued for indexing
- **THEN** the system marks the older pending jobs as `superseded`
- **AND** those jobs are not picked for new worker execution

#### Scenario: Older running job finishes after a newer version is already published

- **GIVEN** a worker is finishing a job for snapshot version `N`
- **AND** the document already has `latestIndexedVersion > N`
- **WHEN** the worker reaches the publish gate
- **THEN** it marks the job as `superseded`
- **AND** it does not overwrite `documents.latestIndexedVersion`

### Requirement: Index Triggering Must Avoid Duplicate Active Jobs For The Same Snapshot

The system SHALL keep at most one active index job per `(documentId, targetSnapshotVersion)` pair.

#### Scenario: Re-triggering the same snapshot reuses the active job

- **GIVEN** a document already has a `pending` or `running` job for snapshot version `N`
- **WHEN** the client calls `POST /api/documents/:documentId/index` targeting snapshot version `N`
- **THEN** the system returns the existing active job
- **AND** it does not create a second active job for the same document-version pair

#### Scenario: A newer snapshot still creates a fresh job

- **GIVEN** a document already has an active job for snapshot version `N`
- **WHEN** the client triggers indexing for snapshot version `N + 1`
- **THEN** the system creates a new job for snapshot version `N + 1`
- **AND** older active jobs are handled by the supersession rules for stale versions

### Requirement: Indexed Version Must Publish Atomically On Success Only

The system SHALL update `documents.latestIndexedVersion` only after the full indexing pipeline succeeds for the target snapshot version.

#### Scenario: Successful publish advances the indexed pointer

- **GIVEN** preprocessing, chunking, embedding, and vector upsert all succeed
- **WHEN** the worker completes the publish step
- **THEN** `documents.latestIndexedVersion` is updated to `targetSnapshotVersion`
- **AND** the job is marked `succeeded`

#### Scenario: Failed job leaves prior indexed truth untouched

- **GIVEN** a document already has `latestIndexedVersion = N`
- **WHEN** a later job for snapshot version `N + 1` fails
- **THEN** `documents.latestIndexedVersion` remains `N`
- **AND** the previous searchable version stays available

### Requirement: M4 Embedding Baseline Must Respect Provider Batch And Dimension Constraints

The system SHALL make embedding calls in provider-safe batches and refuse to publish into a vector collection with mismatched dimensions.

#### Scenario: Document chunks are embedded in batches no larger than the provider limit

- **GIVEN** the selected embedding provider only accepts up to 10 texts per request
- **WHEN** the worker embeds a snapshot with more than 10 chunks
- **THEN** `packages/rag` splits the chunks into batches of at most 10 inputs
- **AND** it aggregates the returned vectors before continuing to vector-store upsert

#### Scenario: Collection dimension mismatch fails the job before writes

- **GIVEN** the configured embedding dimensions are `D`
- **AND** the target Qdrant collection already exists with dimensions not equal to `D`
- **WHEN** the worker prepares to upsert vectors
- **THEN** the job fails with a configuration error
- **AND** it does not write partial vectors into the mismatched collection

### Requirement: Stale Running Jobs Must Be Recoverable By The Worker

The system SHALL allow the worker to reclaim jobs left in `running` after the lock window expires.

#### Scenario: Expired running job becomes claimable again

- **GIVEN** an index job is in `running`
- **AND** its `lockedAt` is older than the configured worker lease timeout
- **WHEN** a worker polling cycle looks for claimable jobs
- **THEN** that job is treated as reclaimable work
- **AND** the worker increments `attemptCount` when reclaiming it

#### Scenario: Fresh running job is not stolen by another worker

- **GIVEN** an index job is in `running`
- **AND** its `lockedAt` is still within the configured worker lease timeout
- **WHEN** another worker polling cycle runs
- **THEN** that job is not claimable by a second worker
