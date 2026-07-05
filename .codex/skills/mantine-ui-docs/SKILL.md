---
name: mantine-ui-docs
description: Use when implementing, debugging, refactoring, or documenting Mantine UI integrations in this project. Apply this skill for Mantine component selection, provider setup, theming, styling, forms, hooks, AppShell/layout usage, and official API/example lookup. Treat Mantine official LLM documentation as the first reference source before inventing custom patterns.
---

# Mantine UI Docs

Use the official `Mantine` LLM documentation as the first reference source for `Mantine` work in this repository.

## Workflow

1. Confirm the task is `Mantine`-related.
2. Read [references/official-sites.md](./references/official-sites.md) before making assumptions about components, theming, styles, hooks, forms, or integration patterns.
3. Prefer official `Mantine` LLM docs and setup guides over memory or ad hoc snippets.
4. When choosing UI primitives, prefer existing `Mantine` components and documented composition patterns before building custom replacements.
5. If project constraints require deviation, state the reason clearly in code comments or docs.

## Project Rules

1. For setup questions, use the official getting started guide first, especially around `MantineProvider`, styles imports, and SSR color-scheme handling.
2. For component usage, prefer the matching `core-*`, `form-*`, `hooks-*`, `styles-*`, or `theming-*` LLM page before guessing props or behavior.
3. For styling and theme customization, prefer documented `Styles API`, theme object, CSS modules, and style props patterns over custom CSS architecture unless the project already established one.
4. When the official docs are silent, keep the solution compatible with the existing DocWeave architecture and mark any inference as an inference.

## Output Expectations

1. Reference the official source you used when it materially affects the implementation.
2. Avoid presenting guessed `Mantine` APIs as facts.
3. Keep new project docs consistent with the rule that `https://mantine.dev/llms/` is the primary reference for `Mantine` usage in this repository.
