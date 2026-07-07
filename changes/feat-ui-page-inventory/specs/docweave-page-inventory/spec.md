# 能力规格：docweave-page-inventory

## ADDED Requirements

### Requirement: Page Inventory Document

The system SHALL produce a `docs/ui/page-inventory.md` document that lists all DocWeave pages.

#### Scenario: Page inventory exists and is accessible

- **GIVEN** the DocWeave project
- **WHEN** a developer or AI agent needs to know which pages exist
- **THEN** they can open `docs/ui/page-inventory.md` to see a complete table of all pages with routes, status, and milestone mapping

#### Scenario: Page inventory includes navigation flow

- **GIVEN** the page inventory document
- **WHEN** a developer reads the navigation section
- **THEN** they see a clear diagram showing page-to-page transitions, login flow, and entry points

### Requirement: Priority Labels on Pages

The system SHALL label each page with its implementation priority.

#### Scenario: Priority is documented per page

- **GIVEN** the page inventory document
- **WHEN** a developer checks a specific page entry
- **THEN** the entry shows whether it is P0 (blocking dependency), P1 (core value), P2 (important), P3 (completion), or P4 (future)

### Requirement: Status Labels on Pages

The system SHALL track implementation status for each page.

#### Scenario: Status is documented per page

- **GIVEN** the page inventory document
- **WHEN** a developer checks a specific page entry
- **THEN** the entry shows whether it is "已实现", "第一阶段待实现", or "后续阶段"
