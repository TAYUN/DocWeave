# 能力规格

## ADDED Requirements

### Requirement: Real Login And Logout

The system SHALL authenticate a user with real credentials and issue a usable API access token for the M2 flow.

#### Scenario: Login with valid credentials

- **WHEN** a user submits a valid email and password to the login endpoint
- **THEN** the API returns a persisted access token and serialized current-user payload

#### Scenario: Logout current token

- **WHEN** an authenticated user calls the logout endpoint
- **THEN** the API revokes the current access token and the same token can no longer access protected resources

### Requirement: Current User Endpoint

The system SHALL expose the real current user behind authentication instead of a scaffold response.

#### Scenario: Read current user

- **WHEN** an authenticated request calls the current-user endpoint
- **THEN** the API returns the authenticated user identity from the active token context

#### Scenario: Reject anonymous current-user access

- **WHEN** an anonymous request calls the current-user endpoint
- **THEN** the API rejects the request instead of returning a demo user

### Requirement: Protected M2 Resource Boundary

The system SHALL require authentication before entering the M2 business resource chain.

#### Scenario: Anonymous request hits workbench resources

- **WHEN** an anonymous request reads or writes `spaces` or `documents`
- **THEN** the API rejects the request as unauthenticated

#### Scenario: Authenticated request hits workbench resources

- **WHEN** an authenticated request reads or writes `spaces` or `documents`
- **THEN** the API allows the request and preserves the existing metadata/editor behavior
