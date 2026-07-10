# 能力规格

## ADDED Requirements

### Requirement: Success Response Envelope

The system SHALL expose a stable success response envelope for the current `/api/*` HTTP endpoints.

#### Scenario: Read endpoint returns payload

- **WHEN** a client calls a successful read endpoint
- **THEN** the API returns `{ data }` as the response body

#### Scenario: Write endpoint returns payload

- **WHEN** a client calls a successful write endpoint that returns a resource payload
- **THEN** the API returns `{ message, data }` as the response body

#### Scenario: Write endpoint returns no payload

- **WHEN** a client calls a successful write endpoint that only confirms an action
- **THEN** the API returns `{ message }` as the response body

### Requirement: Error Response Envelope

The system SHALL expose a stable JSON error envelope for business errors and framework-generated API exceptions.

#### Scenario: Business error response

- **WHEN** the API rejects a request because the requested resource is missing or the action is invalid
- **THEN** the response body contains a human-readable `message`

#### Scenario: Validation error response

- **WHEN** a request fails server-side input validation
- **THEN** the API responds with `422` and a JSON body containing `message` and `errors`

#### Scenario: Authentication error response

- **WHEN** an unauthenticated request reaches a protected endpoint
- **THEN** the API responds with `401` and a JSON body containing `message`

### Requirement: Frontend Query-Friendly API Layer

The web API layer SHALL shield pages and TanStack Query callers from raw envelope details.

#### Scenario: Successful API call from web layer

- **WHEN** `apps/web/src/lib/api.ts` receives a successful API response
- **THEN** it returns the unwrapped `data` payload to callers

#### Scenario: Failed API call from web layer

- **WHEN** `apps/web/src/lib/api.ts` receives an API error response
- **THEN** it throws an `Error` or `AuthError` derived from `message` or validation `errors`

### Requirement: Envelope Responsibility Boundary

The system SHALL keep business DTO contracts separate from HTTP response envelope conventions.

#### Scenario: Team extends API DTOs

- **WHEN** a developer adds or changes a domain DTO in `packages/contracts`
- **THEN** the default response envelope convention remains defined in docs and HTTP entry points instead of being treated as a business DTO concern
