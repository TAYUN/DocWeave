---
name: blocknote-docs
description: Use when implementing, debugging, refactoring, or documenting BlockNote-related code and architecture in this project. Apply this skill for BlockNote editor setup, AI integration, backend integration, schema questions, API usage, extension points, or example lookup. Treat the official BlockNote website and examples as the first reference source before inventing custom patterns.
---

# BlockNote Docs

Use the official `BlockNote` documentation and examples sites as the first reference source for `BlockNote` work in this repository.

## Workflow

1. Confirm the task is `BlockNote`-related.
2. Read [references/official-sites.md](./references/official-sites.md) before making assumptions about APIs, integration patterns, or examples.
3. Prefer official `BlockNote` documentation and the `https://www.blocknotejs.org/examples` examples over memory or ad hoc patterns.
4. Keep project decisions aligned with the official ecosystem when the docs already provide a supported path.
5. If project constraints require deviation, state the reason clearly in code comments or docs.

## Project Rules

1. For editor AI, prefer the official `@blocknote/xl-ai` and `@blocknote/xl-ai/server` path unless the project explicitly decides otherwise.
2. For document-side processing, snapshots, export, or RAG preprocessing, prefer `@blocknote/server-util` when it covers the need.
3. When answering `BlockNote` questions during development, use the official docs and examples before proposing custom abstractions.
4. When the official docs are silent, keep the solution compatible with the existing DocWeave architecture and document any inference as an inference.

## Output Expectations

1. Reference the official source you used when it materially affects the implementation.
2. Avoid presenting guessed `BlockNote` APIs as facts.
3. Keep new project docs consistent with the rule that `https://www.blocknotejs.org/` is the primary reference for `BlockNote`.
