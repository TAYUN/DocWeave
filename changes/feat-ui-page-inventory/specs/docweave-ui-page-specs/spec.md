# 能力规格：docweave-ui-page-specs

## ADDED Requirements

### Requirement: Per-Page Specification Files

The system SHALL produce individual page specification files under `docs/ui/pages/`, one per page.

#### Scenario: Each page has a spec file

- **GIVEN** the DocWeave project
- **WHEN** a developer or AI agent needs to implement or review a specific page
- **THEN** they can open `docs/ui/pages/<page-name>.md` to find the complete specification for that page

### Requirement: Page Spec Structure

Each page specification SHALL include the following sections:
- Route
- Purpose (one sentence)
- ASCII wireframe layout diagram
- Content sections with descriptions
- State matrix (loading, empty, error, not found, disabled, restricted / unauthorized)
- Navigation relationships
- Implementation constraints

#### Scenario: Complete page spec coverage

- **GIVEN** a page specification file
- **WHEN** a developer reads it
- **THEN** they find all required sections documented with concrete, implementable detail

#### Scenario: Disabled and restricted states are not collapsed together

- **GIVEN** a developer or AI agent implements a page from the page spec
- **WHEN** they read the state matrix
- **THEN** they can distinguish between a control that is visible but temporarily unavailable (`disabled`) and a page or action the current user cannot access (`restricted / unauthorized`)
- **AND** the spec tells them the restricted state needs explanation and a fallback or return path

### Requirement: Current-Phase Coverage

The page specification files SHALL cover at minimum the four currently implemented pages (P01-P04):
- P01 登录页 `/login`
- P02 工作台首页 `/`
- P03 空间详情页 `/spaces/:spaceId`
- P04 文档编辑页 `/documents/:documentId`

Plus provide placeholder entries for planned pages (P05-P08).

#### Scenario: Current and planned page specs are both discoverable

- **GIVEN** a developer or AI agent needs to implement, review, or extend DocWeave pages
- **WHEN** they inspect `docs/ui/pages/`
- **THEN** they can find full specs for the currently implemented baseline pages (P01-P04)
- **AND** they can also find placeholder or forward-looking specs for planned pages that should not be reinvented from scratch
