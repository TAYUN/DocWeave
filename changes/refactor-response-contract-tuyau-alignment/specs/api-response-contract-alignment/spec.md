# 能力规格

## ADDED Requirements

### Requirement: Shared API Response Contracts

The system SHALL provide reusable response envelope contract primitives so frontend API wrappers and backend functional tests do not redefine the same HTTP response shells locally.

#### Scenario: Frontend reuses shared success envelope

- **WHEN** the frontend consumes a typed HTTP response that returns `{ data: T }`
- **THEN** it MUST be able to reference a shared `ApiSuccessResponse<T>` contract
- **AND** the business payload `T` MUST remain defined by the relevant domain contract

#### Scenario: Tests reuse shared error envelope

- **WHEN** backend functional tests assert `{ message, errors? }`
- **THEN** they MUST be able to reference a shared `ApiErrorResponse`
- **AND** they SHOULD avoid redefining anonymous local error envelope types

### Requirement: RAG Search Registry Compatibility

The system SHALL keep Tuyau registry typing stable when exposing the HTTP RAG search endpoint.

#### Scenario: RAG search body avoids registry query collision

- **WHEN** the API receives `POST /api/rag/search`
- **THEN** the request body MUST use `searchText` instead of `query`
- **AND** Tuyau registry generation MUST keep sibling routes like `spaces.index` and `documents.index` type-safe

#### Scenario: Workspace type check stays green

- **WHEN** the generated registry is consumed by `apps/web/src/lib/tuyau-client.ts`
- **THEN** `createTuyau({ registry })` MUST preserve the route tree typing
- **AND** `pnpm check:workspace` MUST pass without `TransformApiDefinition<unknown>` regressions
