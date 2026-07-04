# 能力规格

## ADDED Requirements

### Requirement: Phase-1 Application Directories

The system SHALL create explicit application directories for `apps/web`, `apps/api`, `apps/collab`, and `apps/worker` in the monorepo baseline.

#### Scenario: Inspect app boundaries after bootstrap

- **WHEN** a developer lists the `apps/` directory after bootstrap
- **THEN** the four phase-1 application directories exist and are individually addressable

#### Scenario: Align app set with approved roadmap

- **WHEN** the initialized app directories are compared with the phase-1 planning document
- **THEN** the directory set matches the approved first-phase runtime split

### Requirement: Role-Oriented Application Separation

The system SHALL preserve the intended responsibility boundary of each phase-1 application through its initial structure and naming.

#### Scenario: Review web application role

- **WHEN** a developer inspects the baseline for `apps/web`
- **THEN** it is clearly positioned as the React SPA frontend entrypoint rather than a backend or shared package

#### Scenario: Review backend service roles

- **WHEN** a developer inspects the baseline for `apps/api`, `apps/collab`, and `apps/worker`
- **THEN** the structure reflects separate roles for business API, collaboration service, and background worker execution
