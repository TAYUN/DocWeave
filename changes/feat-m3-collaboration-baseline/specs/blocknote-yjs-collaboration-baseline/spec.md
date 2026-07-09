# 能力规格：blocknote-yjs-collaboration-baseline

## ADDED Requirements

### Requirement: Document Page Must Initialize Collaboration In A Stable Order

The system SHALL initialize collaboration on the document page in the order `metadata -> collaboration token -> provider -> editor`, with awareness attached after the provider is established.

#### Scenario: Collaboration setup waits for metadata and token

- **GIVEN** a user opens a document page
- **WHEN** collaboration initialization begins
- **THEN** the page first resolves document metadata and access context
- **AND** then requests the collaboration token before creating the collaboration provider

#### Scenario: Awareness attaches after provider setup

- **GIVEN** document metadata and the collaboration token have been resolved
- **WHEN** the page creates the collaboration provider
- **THEN** it initializes the editor from that provider-backed collaboration context
- **AND** awareness is attached as an additional capability after the provider is established

### Requirement: BlockNote Must Use Official Collaboration Binding

The system SHALL use BlockNote's supported collaboration integration path for M3.

#### Scenario: Collaborative editor is created from provider and Yjs fragment

- **GIVEN** the page has a `Y.Doc`, collaboration provider, and user collaboration identity
- **WHEN** the editor is created in collaboration mode
- **THEN** the editor uses `withCollaboration(...)`
- **AND** the editor binds to a shared fragment from the `Y.Doc`

### Requirement: Collaboration Must Be The Primary M3 Document Body Path

The system SHALL avoid keeping long-lived dual document truths between REST body state and collaboration body state during M3.

#### Scenario: Collaboration path becomes primary after successful setup

- **GIVEN** collaboration setup succeeds
- **WHEN** the document editor renders
- **THEN** the shared Yjs collaboration state is the primary source of the editable document body
- **AND** REST content is not kept as a competing long-lived writable source

#### Scenario: Local snapshot is only a fallback

- **GIVEN** collaboration setup fails or times out during M3 initialization
- **WHEN** the document page falls back
- **THEN** it may render a local snapshot fallback
- **AND** that fallback is treated as a degraded path instead of the normal collaborative editing path

### Requirement: Read Access And Edit Access Must Follow Collaboration Capabilities

The system SHALL use trusted collaboration capabilities to distinguish read-only and editable collaboration sessions.

#### Scenario: Editable session mounts collaboration editing behavior

- **GIVEN** the collaboration token payload includes `canEdit=true`
- **WHEN** the document page initializes collaboration
- **THEN** the page mounts editable collaboration behavior

#### Scenario: Read-only session remains collaborative but not editable

- **GIVEN** the collaboration token payload includes `canRead=true` and `canEdit=false`
- **WHEN** the document page initializes collaboration
- **THEN** the page may connect to collaboration for read-only viewing and presence
- **AND** it does not enable editable body mutations

### Requirement: M3 Must Expose Minimum Presence Visibility

The system SHALL expose minimum online-member visibility for M3 collaboration sessions.

#### Scenario: Presence entries use shared awareness contract

- **GIVEN** awareness updates arrive from the collaboration provider
- **WHEN** the UI derives online-member state
- **THEN** it uses the shared collaboration awareness and presence contracts
- **AND** it does not redefine presence field names in the page layer
