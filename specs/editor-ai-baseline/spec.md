# Editor AI Baseline Specification

## ADDED Requirements

### Requirement: Official BlockNote AI protocol

The system SHALL use `@blocknote/xl-ai` on the editor and `@blocknote/xl-ai/server` with the Vercel AI SDK Data Stream Protocol on the API path.

#### Scenario: Editor AI request reaches the official server protocol

- **WHEN** an authenticated user starts an editor AI action
- **THEN** the web client sends the BlockNote AI message and tool-definition payload to the API endpoint
- **AND** the API returns a UI message data stream compatible with BlockNote AI

### Requirement: Action-based editor entries

The editor SHALL expose selection, Slash, and toolbar entry points without adding a side chat panel.

#### Scenario: User invokes AI from a selection

- **WHEN** the user selects editable document content and opens the AI entry
- **THEN** the AI action menu is visible and can start a supported action

#### Scenario: User invokes AI from Slash

- **WHEN** the user types the AI Slash command at an editable cursor
- **THEN** the Slash menu exposes the supported editor AI actions

### Requirement: Supported editor actions

The system SHALL support rewrite, expand, shorten, translate, and summarize as the first action set.

#### Scenario: Supported action is requested

- **WHEN** the user starts one of the five supported actions
- **THEN** the action is encoded in the editor AI command or prompt
- **AND** the model receives the relevant local document state

### Requirement: Permission and capability enforcement

The API SHALL authenticate the request and SHALL verify access to the target document before forwarding model work. A read-only user SHALL NOT be allowed to apply a document-modifying tool call.

#### Scenario: Unauthenticated request

- **WHEN** a request reaches the editor AI endpoint without an authenticated session
- **THEN** the API rejects it before model invocation

#### Scenario: Read-only user receives a suggestion

- **WHEN** a read-only user starts an allowed generation
- **THEN** the API may stream a suggestion
- **BUT** the client cannot apply a document-modifying result

### Requirement: Local context boundary

The system SHALL limit editor AI business context to the document title, selected content, current block, and bounded neighboring blocks. It SHALL NOT perform RAG retrieval for M5.

#### Scenario: Local context is built

- **WHEN** an editor AI request contains BlockNote document state
- **THEN** the API validates the document identity and derives only bounded local context
- **AND** no knowledge-base search is performed

### Requirement: Streaming and cancellation

The system SHALL stream model output through the BlockNote-compatible data stream and SHALL allow the client to abort an in-flight request.

#### Scenario: Generation is stopped

- **WHEN** the user stops an active generation
- **THEN** the client aborts the request
- **AND** the editor returns to an interactive non-generating state

### Requirement: Collaboration-safe application

AI results SHALL be applied through the existing BlockNote/Yjs editor instance and SHALL NOT write a second document truth directly through the API.

#### Scenario: AI tool call is applied

- **WHEN** an editable user accepts a valid AI result
- **THEN** the result is applied through the current editor instance
- **AND** existing collaboration and automatic runtime persistence observe the resulting document update

### Requirement: Failure recovery

The system SHALL present recoverable states for permission failure, provider failure, timeout, malformed AI response, and aborted generation.

#### Scenario: Provider fails

- **WHEN** the model provider returns an error
- **THEN** the client shows an understandable failure state
- **AND** the document content and editor interaction remain usable

## MODIFIED Requirements

### Requirement: AI runtime baseline

`packages/ai` SHALL retain its shared provider abstraction while adding a streaming language-model entry point for editor AI. Provider secrets SHALL remain server-side.

#### Scenario: Editor AI obtains a server-side language model

- **WHEN** the API initializes the editor AI service with valid provider configuration
- **THEN** `packages/ai` returns a Vercel AI SDK language model suitable for `streamText`
- **AND** the browser never receives the provider API key
