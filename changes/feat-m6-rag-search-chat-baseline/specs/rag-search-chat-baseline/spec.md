# M6 RAG 搜索与问答基线规格

## ADDED Requirements

### Requirement: Index points SHALL expose traceable document metadata

The indexing pipeline SHALL produce points whose payload contains `workspaceId`, `spaceId`, `documentId`, `snapshotVersion`, `blockId`, `chunkId`, `headingPath`, and `plainText`.

#### Scenario: Indexing a stable snapshot

- **WHEN** a worker indexes a valid stable snapshot containing multiple BlockNote blocks
- **THEN** every Qdrant point contains the required document, version, block, chunk, heading, and text metadata
- **AND** each point can be mapped back to exactly one source block and snapshot version.

#### Scenario: Re-indexing after the metadata schema changes

- **WHEN** the M6 index-point schema is enabled for an existing indexed snapshot
- **THEN** the system SHALL use an explicit re-index strategy before treating the new payload as Citation-capable
- **AND** points that do not satisfy the required metadata SHALL not be presented as Citation-capable results.

### Requirement: Retrieval SHALL apply permission scope before optional space filtering

The API SHALL authenticate the current user, compute the user-visible document scope, and pass that scope to the retrieval layer before applying an optional `spaceId` narrowing filter.

#### Scenario: Default search over all visible documents

- **WHEN** an authenticated user submits a search without `spaceId`
- **THEN** retrieval SHALL search only documents visible to that user across all accessible spaces.

#### Scenario: Search within a selected space

- **WHEN** an authenticated user submits a search with `spaceId`
- **THEN** the API SHALL first compute the user-visible document scope
- **AND** retrieval SHALL narrow that already-authorized scope to the requested space.

#### Scenario: Unauthorized space filter

- **WHEN** an authenticated user supplies a `spaceId` that is not visible to the user
- **THEN** the API SHALL return HTTP 403 with an `ApiErrorResponse` whose code is `AUTH_FORBIDDEN`
- **AND** SHALL NOT query Qdrant.

#### Scenario: Existing space belongs to another user

- **WHEN** an authenticated user selects an existing space where they have no `space_members` row
- **THEN** the API SHALL return HTTP 403 with `AUTH_FORBIDDEN`
- **AND** SHALL NOT invoke embedding, Qdrant, or model generation.

### Requirement: Space membership SHALL be the sole RAG permission truth

The API SHALL derive RAG-visible documents only from `space_members`. A space owner SHALL be represented by a membership row whose role is `owner`; no controller, Qdrant payload, or client input may grant access independently.

#### Scenario: Creating a space establishes owner access

- **WHEN** an authenticated user creates a space
- **THEN** the system SHALL create exactly one owner membership for that user and space
- **AND** the owner SHALL be able to retrieve that space's active indexed documents.

#### Scenario: MCP retrieval cannot bypass membership

- **WHEN** an MCP caller is not associated with an authenticated space member identity
- **THEN** it SHALL NOT invoke the RAG retrieval layer
- **AND** it SHALL receive an authentication or authorization failure rather than document hits.

### Requirement: RAG routes SHALL require authentication and enforce index-version visibility

The `/api/rag/search` and `/api/rag/chat` endpoints SHALL require an authenticated session and SHALL retrieve only points belonging to each document's active `latestIndexedVersion`.

#### Scenario: Unauthenticated request

- **WHEN** an unauthenticated client calls either RAG endpoint
- **THEN** the API SHALL return HTTP 401
- **AND** SHALL NOT call the retrieval or model layer.

#### Scenario: Document without an indexed version

- **WHEN** an authorized document has no `latestIndexedVersion`
- **THEN** its points SHALL not contribute to search or chat context.

#### Scenario: Stale indexed point

- **WHEN** Qdrant contains a point for a snapshot older than the document's active indexed version
- **THEN** retrieval SHALL exclude that point from the result set.

### Requirement: Search SHALL use HTTP JSON and return traceable hits

The search endpoint SHALL use a normal HTTP JSON request/response, SHALL wrap successful data in `ApiSuccessResponse<RagSearchResponse>`, and SHALL return bounded hits containing score, snippet, and Citation data.

#### Scenario: Search returns matching content

- **WHEN** an authorized user searches indexed content
- **THEN** the response SHALL return bounded hits ordered by retrieval score
- **AND** every hit SHALL include a Citation containing `documentId`, `snapshotVersion`, and `blockId`.

#### Scenario: Search has no matching content

- **WHEN** no authorized active-version point matches the search
- **THEN** the API SHALL return an `ApiSuccessResponse` containing an empty hit list
- **AND** SHALL not fabricate a Citation.

### Requirement: HTTP errors SHALL use the shared API error envelope

The RAG controller SHALL map pre-stream authentication, validation, permission, and resource failures to the shared `ApiErrorResponse` handled by `apps/api/app/exceptions/handler.ts`. It SHALL not expose ORM, Qdrant, provider, or controller-local error shapes.

#### Scenario: Validation failure before streaming

- **WHEN** a RAG request violates the Vine validator
- **THEN** the API SHALL return the shared validation error envelope with code `VALIDATION_FAILED`
- **AND** SHALL not start a model stream.

#### Scenario: Permission failure before streaming

- **WHEN** the user is unauthenticated or requests an unauthorized space
- **THEN** the API SHALL return the shared `ApiErrorResponse` with `AUTH_UNAUTHORIZED` or `AUTH_FORBIDDEN`
- **AND** SHALL not query Qdrant or the model layer.

### Requirement: Chat SHALL support single-turn streaming without Socket.IO

The chat endpoint SHALL accept one user message, perform authorized retrieval, and return an HTTP streaming response. M6 SHALL NOT introduce Socket.IO or a second long-lived realtime transport for RAG.

#### Scenario: Successful single-turn chat

- **WHEN** an authenticated user submits one message
- **THEN** the API SHALL retrieve authorized active-version context and stream the answer
- **AND** the stream SHALL expose the business sequence `start -> retrieval -> text-delta/citation -> finish`.

#### Scenario: Client aborts generation

- **WHEN** the client aborts an in-flight chat request
- **THEN** the server SHALL stop forwarding model output and release the request resources
- **AND** the client SHALL leave the chat page usable.

#### Scenario: Model or retrieval failure

- **WHEN** retrieval or generation fails
- **THEN** the stream SHALL expose the documented RAG error code and retryability
- **AND** SHALL not report a successful `finish` event for the failed request.

### Requirement: Citation SHALL support best-effort navigation to the current editor

The web client SHALL navigate a Citation to the current document editor route and SHALL attempt to locate the cited snapshot/block without introducing a separate read-only snapshot view in M6.

#### Scenario: Citation points to the current document

- **WHEN** a user clicks a Citation for a document that is available in the editor
- **THEN** the client SHALL navigate to the document editor
- **AND** SHALL attempt to focus or highlight the cited `blockId`.

#### Scenario: Exact block navigation is unavailable

- **WHEN** the client cannot locate the cited block or snapshot in the current editor state
- **THEN** it SHALL still navigate to the document editor
- **AND** SHALL show a non-fatal best-effort navigation state rather than failing the whole search or chat result.

### Requirement: Search and chat pages SHALL expose explicit loading and failure states

The web pages SHALL define view-models and visible states for loading, empty results, restricted access, no indexed content, failed indexing, streaming, cancellation, and errors.

#### Scenario: Restricted or unavailable knowledge scope

- **WHEN** the API reports that the user cannot access the requested scope
- **THEN** the page SHALL show a comprehensible restricted state
- **AND** SHALL not display unauthorized hits or citations.

#### Scenario: Chat history policy

- **WHEN** a user completes a M6 chat request
- **THEN** the page SHALL display the current single-turn exchange locally
- **AND** SHALL not imply that a persistent multi-turn conversation has been stored.

### Requirement: Indexed knowledge SHALL have a discoverable document-page preparation flow

The web client SHALL expose stable snapshot creation and index-job submission from the document editor through `apps/web/src/lib/api.ts`. The editor SHALL show whether the current document has no snapshot, has a snapshot awaiting indexing, is being indexed, or has an active indexed version.

#### Scenario: Preparing a document for knowledge search

- **WHEN** an editor chooses to prepare a document with unsaved changes for retrieval
- **THEN** the client SHALL save the current document content before creating its stable snapshot
- **AND** it SHALL allow the editor to submit an index job for that snapshot.

#### Scenario: Index job is only queued

- **WHEN** the client successfully submits a document index job
- **THEN** it SHALL report that the job is running in the background
- **AND** SHALL NOT present the document as searchable until its active indexed version is available.

## MODIFIED Requirements

### Requirement: Existing RAG contracts SHALL be split between domain events and transport adapters

The shared RAG contracts SHALL define business request, response, Citation, and stream-event semantics, while API adapters SHALL define the concrete HTTP/AI SDK stream encoding. Provider-native events SHALL not be exposed directly to the web client.

#### Scenario: Transport encoding changes

- **WHEN** the API changes the underlying AI SDK stream adapter
- **THEN** the business-level `RagStreamEvent` semantics SHALL remain stable
- **AND** the web client SHALL continue consuming the documented event sequence.

### Requirement: Web API and pages SHALL consume stable project boundaries

The Web implementation SHALL call RAG endpoints through `apps/web/src/lib/api.ts`, SHALL use domain contracts from `@docweave/contracts/<domain>`, and SHALL convert API data to feature view-models before page rendering.

#### Scenario: Successful search response

- **WHEN** the API returns `ApiSuccessResponse<RagSearchResponse>`
- **THEN** the Web API layer SHALL unwrap the envelope
- **AND** the page SHALL render a RAG view-model rather than a raw Tuyau response or transport payload.

#### Scenario: Shared API error response

- **WHEN** the API returns `ApiErrorResponse`
- **THEN** the Web API layer SHALL preserve the stable error code for state mapping
- **AND** the page SHALL not parse framework-specific error details directly.
