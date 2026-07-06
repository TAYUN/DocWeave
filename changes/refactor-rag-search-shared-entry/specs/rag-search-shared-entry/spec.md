# 能力规格

## ADDED Requirements

### Requirement: Shared RAG Search Entry

The system SHALL provide a single shared RAG search entry for scaffold search behavior so that HTTP and MCP do not maintain separate placeholder implementations.

#### Scenario: HTTP search uses shared service

- **WHEN** the API receives `POST /api/rag/search`
- **THEN** the controller delegates search execution to the shared RAG search service
- **AND** the response keeps the existing `data.query` and `data.hits` structure

#### Scenario: MCP search uses shared service

- **WHEN** the MCP client invokes `search_knowledge`
- **THEN** the MCP tool delegates search execution to the shared RAG search service
- **AND** the structured response keeps the existing `query` and `hits` structure

#### Scenario: Shared entry remains scaffold-compatible

- **WHEN** the shared RAG search service is used before real retrieval is implemented
- **THEN** it MAY return the current placeholder hit set
- **AND** HTTP and MCP MUST both reflect that same placeholder result
