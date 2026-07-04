# 能力规格

## ADDED Requirements

### Requirement: PostgreSQL Metadata Connection

The system SHALL use PostgreSQL as the local metadata database baseline for `apps/api`.

#### Scenario: Resolve database connection settings

- **WHEN** the API boots in local development
- **THEN** it reads `DB_CONNECTION=pg` and the associated PostgreSQL environment variables

#### Scenario: Run metadata migrations

- **WHEN** a developer runs the migration command
- **THEN** the database creates the approved metadata tables needed for the current foundation scope

### Requirement: Space and Document Metadata Tables

The system SHALL define persistent tables for `spaces` and `documents`.

#### Scenario: Inspect metadata schema

- **WHEN** a developer reviews the migrations or generated Lucid schema
- **THEN** the schema includes `spaces` and `documents` with their relationship boundary

### Requirement: Baseline Seed Data

The system SHALL provide seed data for the initial local metadata baseline.

#### Scenario: Seed the development database

- **WHEN** a developer runs the seeder
- **THEN** the local database contains at least the approved baseline spaces and documents used by the current web shell
