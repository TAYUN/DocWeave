# 能力规格

## ADDED Requirements

### Requirement: Mantine Product UI Baseline

The system SHALL use Mantine as the primary product UI component library for `apps/web`.

#### Scenario: Inspect frontend dependency baseline

- **WHEN** a developer reviews `apps/web/package.json`
- **THEN** the frontend includes `@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, and `@mantine/utils`
- **AND** the frontend keeps `react`, `react-dom`, `@tanstack/react-router`, and `@tanstack/react-query`
- **AND** the frontend does not reintroduce `shadcn/ui` as the active product UI baseline

#### Scenario: Inspect frontend provider wiring

- **WHEN** a developer reviews `apps/web/src/main.tsx`
- **THEN** the application tree is wrapped by `MantineProvider`
- **AND** the existing `QueryClientProvider` and `RouterProvider` remain in the runtime tree
- **AND** Mantine core styles are loaded from the frontend entrypoint

### Requirement: Mantine-Compatible Global Styling

The system SHALL keep Tailwind CSS available for layout and utility styling while letting Mantine own the component styling baseline.

#### Scenario: Inspect frontend global styles

- **WHEN** a developer reviews `apps/web/src/index.css`
- **THEN** the stylesheet defines or hosts Mantine-compatible global variables and app-level custom styles
- **AND** Tailwind CSS directives remain available for layout or utility usage
- **AND** the global styling strategy does not depend on shadcn-specific theme tokens

### Requirement: Product Screens Use Mantine Interaction Components

The system SHALL render the current workspace shell and metadata editing flows with Mantine interaction components instead of ad hoc button or form primitives.

#### Scenario: Inspect workspace shell and overview flow

- **WHEN** a developer reviews the route components in `apps/web/src/router.tsx`
- **THEN** the overview, space, and document flows use Mantine form, layout, feedback, and action components for the active UI interactions
- **AND** the existing create-space, create-document, and update-document behaviors remain reachable
- **AND** the change does not alter the existing query and mutation data flow

## MODIFIED Requirements

### Requirement: Technical Documents Reflect Mantine Baseline

The system documentation MUST describe Mantine as the approved product UI baseline and `@blocknote/mantine` as the approved editor UI adapter.

#### Scenario: Inspect technical decision records

- **WHEN** a developer reviews `docs/decisions/01. 最终技术方案确认.md` and `docs/planning/00. 当前实施路线图.md`
- **THEN** the product UI component library is described as a Mantine-based stack
- **AND** the editor UI adapter is described as `@blocknote/mantine`
- **AND** Tailwind CSS is still described as retained for layout and utility styling
