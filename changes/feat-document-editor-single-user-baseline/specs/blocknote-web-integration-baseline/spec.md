# 能力规格

## ADDED Requirements

### Requirement: BlockNote Web Integration

The system SHALL use BlockNote as the single-user editor baseline in `apps/web`.

#### Scenario: Inspect frontend editor implementation

- **WHEN** a developer reviews the document page implementation
- **THEN** the editor is based on BlockNote rather than a temporary textarea fallback

### Requirement: Minimal Editor Package Boundary

The system SHALL expose the frontend editor integration through a reusable package boundary.

#### Scenario: Inspect shared editor boundary

- **WHEN** a developer reviews `packages/editor`
- **THEN** there is a clear reusable entrypoint for the current editor integration
