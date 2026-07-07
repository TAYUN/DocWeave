# 能力规格：docweave-layout-framework

## ADDED Requirements

### Requirement: Global Layout Framework Definition

The system SHALL define a global layout framework document that describes the common shell structure for all authenticated pages.

#### Scenario: Layout framework document exists

- **GIVEN** the DocWeave project
- **WHEN** a developer or AI agent needs to implement a new page
- **THEN** they can read the layout framework document to understand the common AppHeader + Sidebar + MainContent structure

### Requirement: AppHeader Behavior Contract

The layout framework SHALL define the AppHeader as a task-oriented global action area, including the responsibility, enabled scope, and unavailable-state rules of each global entry.

#### Scenario: AppHeader entries are bounded by current phase

- **GIVEN** the layout framework document
- **WHEN** a developer or AI agent implements the AppHeader
- **THEN** they can identify which global actions are currently actionable, which are future placeholders, and what each entry does on click

#### Scenario: Placeholder global actions are not presented as fully available

- **GIVEN** a global entry whose backing capability is scheduled for a later milestone
- **WHEN** the developer reads the layout framework document
- **THEN** the document explains how the unavailable state should be represented, instead of leaving the entry as an unconstrained clickable control

### Requirement: Sidebar Mode Contract

The layout framework SHALL define sidebar modes that change based on the current route context.

#### Scenario: Sidebar modes are documented

- **GIVEN** the layout framework document
- **WHEN** a developer needs to understand what the sidebar shows on each page
- **THEN** they can find a table mapping route patterns to sidebar modes (GlobalMode, SpaceMode, DocumentMode, etc.)

### Requirement: Cross-Page Consistency Rules

The layout framework SHALL document cross-page consistency rules for common UI patterns.

#### Scenario: Consistency rules exist

- **GIVEN** the layout framework document
- **WHEN** a developer implements a new page
- **THEN** they can reference documented rules for empty states, error feedback, loading states, disabled states, restricted states, and not-found handling

### Requirement: Responsive Task Protection

The layout framework SHALL define how desktop, tablet, and mobile layouts preserve the page's primary task when the shell structure adapts.

#### Scenario: Responsive behavior preserves primary task priority

- **GIVEN** a developer or AI agent implementing a page from the layout framework
- **WHEN** they adapt the page to tablet or mobile screens
- **THEN** the document tells them which regions may collapse, move, or defer, while preserving the primary task area as the first priority
