# 能力规格：collaboration-shared-contract-baseline

## ADDED Requirements

### Requirement: Shared Collaboration Contracts

The system SHALL expose a shared collaboration contract module at `packages/contracts/src/collaboration.ts` for `apps/api`, `apps/collab`, and `apps/web`.

#### Scenario: Shared collaboration contracts are available from one source

- **GIVEN** the DocWeave monorepo
- **WHEN** a developer imports collaboration room, token, presence, or connection state types
- **THEN** they can import them from `@docweave/contracts`
- **AND** they do not need to redefine the same structures inside `apps/api`, `apps/collab`, or `apps/web`

### Requirement: Room Naming Must Be Shared And Parseable

The system SHALL provide shared helpers for building and parsing document collaboration room names.

#### Scenario: Room name is built from workspace and document identifiers

- **GIVEN** a `workspaceId` and `documentId`
- **WHEN** the room helper builds a room name
- **THEN** the result MUST follow `workspace:{workspaceId}:document:{documentId}`

#### Scenario: Room name can be parsed back into identifiers

- **GIVEN** a room name in the documented document-room format
- **WHEN** the room helper parses the room name
- **THEN** it returns the original `workspaceId` and `documentId`

#### Scenario: Invalid room names are rejected

- **GIVEN** a room name that does not match the documented format
- **WHEN** the room helper parses the room name
- **THEN** it returns a failure result instead of guessed identifiers

### Requirement: Collaboration Token Payload Must Match Current ID Semantics

The system SHALL define a collaboration token payload that matches the current repository ID types.

#### Scenario: Workspace and document IDs remain strings

- **GIVEN** the current DocWeave repository where `spaces.id` and `documents.id` are strings
- **WHEN** the collaboration token payload is defined
- **THEN** `workspaceId` MUST be `string`
- **AND** `documentId` MUST be `string`

#### Scenario: User ID remains numeric

- **GIVEN** the current user DTO where `user.id` is numeric
- **WHEN** the collaboration token payload and awareness state are defined
- **THEN** `user.id` MUST remain `number`

### Requirement: Shared Presence And Connection State Contracts

The system SHALL define shared awareness, presence, and connection-state contracts for M3.

#### Scenario: Awareness state exposes minimum M3 fields

- **GIVEN** the first-phase collaboration baseline
- **WHEN** the awareness contract is defined
- **THEN** it MUST include `user` and `canEdit`
- **AND** it MUST NOT require cursor or selection telemetry for M3

#### Scenario: Connection states use a shared enum-like contract

- **GIVEN** collaboration UI state is needed in `apps/web`
- **WHEN** the connection status contract is defined
- **THEN** it includes at least `idle`, `connecting`, `connected`, `disconnected`, `unauthorized`, and `error`
