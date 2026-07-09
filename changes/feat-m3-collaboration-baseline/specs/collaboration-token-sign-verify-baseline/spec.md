# 能力规格：collaboration-token-sign-verify-baseline

## ADDED Requirements

### Requirement: API Must Sign Short-Lived Collaboration Tokens

The system SHALL have `apps/api` issue short-lived collaboration tokens for document collaboration rooms.

#### Scenario: Authenticated user requests a collaboration token

- **GIVEN** an authenticated user with access to a target document
- **WHEN** the user calls `POST /api/collaboration/token`
- **THEN** the API returns a short-lived collaboration token
- **AND** the response includes the target `documentId`, computed `roomName`, `provider`, and `expiresInSeconds`

#### Scenario: Anonymous caller cannot obtain a collaboration token

- **GIVEN** a caller without a valid authenticated session or access token
- **WHEN** the caller requests `POST /api/collaboration/token`
- **THEN** the request is rejected

### Requirement: Collaboration Tokens Must Use Shared Payload Semantics

The system SHALL sign collaboration tokens from the shared collaboration payload contract.

#### Scenario: Signed payload contains collaboration room context

- **GIVEN** a collaboration token is signed
- **WHEN** the payload is constructed
- **THEN** it includes `version`, `workspaceId`, `documentId`, `roomName`, `capabilities`, `user`, `issuedAt`, and `expiresAt`

#### Scenario: Token is scoped to a single room

- **GIVEN** a collaboration token is issued for a document room
- **WHEN** the token is later verified by `apps/collab`
- **THEN** the token can only be used for the room encoded by `roomName`

### Requirement: Collab Runtime Must Verify Tokens Without Business Re-Authorization

The system SHALL allow `apps/collab` to verify collaboration tokens locally without becoming a business permission truth source.

#### Scenario: Valid token is accepted by collab runtime

- **GIVEN** a valid unexpired collaboration token signed by `apps/api`
- **WHEN** `apps/collab` verifies the token
- **THEN** the connection is accepted
- **AND** the decoded payload is attached to the connection context for downstream hooks

#### Scenario: Invalid signature or expired token is rejected

- **GIVEN** a token with a bad signature or expired timestamp
- **WHEN** `apps/collab` verifies the token
- **THEN** the connection is rejected

#### Scenario: Token cannot be replayed into another room

- **GIVEN** a valid token for one room
- **WHEN** the token is presented for a different `documentName`
- **THEN** `apps/collab` rejects the connection

### Requirement: M3 Token Implementation Must Avoid JWT Dependency

The system SHALL implement the M3 collaboration token baseline without introducing JWT as a new required dependency.

#### Scenario: M3 token implementation remains dependency-light

- **GIVEN** the first-phase collaboration baseline
- **WHEN** the token signing and verification mechanism is implemented
- **THEN** it uses a shared HMAC secret and a compact custom token format
- **AND** it does not require JWT-specific claims or JWT-specific runtime dependencies
