# 能力规格

## ADDED Requirements

### Requirement: BlockNote Mantine Adapter Alignment

The system SHALL align the shared editor package with the official BlockNote Mantine integration path.

#### Scenario: Inspect shared editor dependencies

- **WHEN** a developer reviews `packages/editor/package.json`
- **THEN** the shared editor depends on `@blocknote/core`, `@blocknote/react`, and `@blocknote/mantine`
- **AND** the shared editor keeps Mantine package support required by the BlockNote adapter
- **AND** the shared editor does not depend on `@blocknote/shadcn`

#### Scenario: Inspect shared editor implementation

- **WHEN** a developer reviews `packages/editor/src/document-editor.tsx`
- **THEN** `BlockNoteView` is imported from `@blocknote/mantine`
- **AND** the editor creation path continues to use `@blocknote/react`
- **AND** the current single-user editor props and save callback contract remain intact

### Requirement: BlockNote Styles Avoid Mantine Duplication

The system MUST load BlockNote's Mantine-specific supplemental styles without duplicating Mantine core styles when the web app already uses Mantine globally.

#### Scenario: Inspect shared editor style imports

- **WHEN** a developer reviews `packages/editor/src/document-editor.tsx`
- **THEN** the shared editor imports `@blocknote/mantine/blocknoteStyles.css`
- **AND** the shared editor does not import `@blocknote/mantine/style.css`
- **AND** the resulting style strategy matches BlockNote's official Mantine guidance for apps that already use Mantine

## MODIFIED Requirements

### Requirement: Single-User Editor Baseline Remains Functionally Stable

The system MUST preserve the current single-user document editing behavior while changing only the UI adapter layer.

#### Scenario: Inspect document page editor integration

- **WHEN** a developer reviews `apps/web/src/router.tsx` and `packages/editor/src/document-editor.tsx`
- **THEN** the document page still renders a reusable `DocumentEditor`
- **AND** editor content changes still flow through the existing `onChange` contract
- **AND** document save requests still serialize the current editor content through the existing update mutation path
