# 能力规格：collaboration-persistence-baseline

## ADDED Requirements

### Requirement: Automatic Collaboration Persistence Must Update Recoverable Body Truth Only

The system SHALL persist collaboration runtime content back into recoverable document truth without automatically creating a stable snapshot.

#### Scenario: `onStoreDocument` writes current collaboration body into `documents.content`

- **GIVEN** a collaboration room has produced updated Yjs content
- **WHEN** the automatic persistence path runs
- **THEN** the system writes the current serialized body into `documents.content`
- **AND** subsequent room restoration can recover from that updated body

#### Scenario: Automatic persistence does not create a stable snapshot

- **GIVEN** automatic collaboration persistence succeeds
- **WHEN** the write completes
- **THEN** it does not create a new `document_snapshots` row
- **AND** it does not advance `documents.latestSnapshotVersion`
- **AND** it does not enqueue a new index job

#### Scenario: Failed automatic persistence does not corrupt existing snapshot truth

- **GIVEN** a collaboration runtime write fails
- **WHEN** the persistence attempt ends in error
- **THEN** existing stable snapshots remain unchanged
- **AND** existing snapshot/index version pointers remain unchanged

### Requirement: Collaboration Runtime Writes Must Be Routed Through API-Owned Persistence

The system SHALL keep database write rules for collaboration runtime persistence inside `apps/api`.

#### Scenario: `apps/collab` updates runtime content through an internal API endpoint

- **GIVEN** `apps/collab` needs to persist room content
- **WHEN** it sends the update to the backend
- **THEN** it calls a dedicated internal collaboration runtime endpoint in `apps/api`
- **AND** `apps/api` owns validation, persistence, and any transaction boundaries for that write
