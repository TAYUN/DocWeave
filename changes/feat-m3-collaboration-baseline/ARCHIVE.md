# Archive Summary

## Change

- Name: `feat-m3-collaboration-baseline`
- Final state: `closing`
- Goal: establish the M3 minimum collaboration loop for DocWeave documents

## Outcome

- Shared collaboration contracts now live in `packages/contracts/src/collaboration.ts`
- `apps/api` now signs and returns real short-lived HMAC collaboration tokens
- `apps/collab` now provides a minimal Hocuspocus runtime with token verification and in-memory `Y.Doc` loading
- `apps/web` and `packages/editor` now initialize collaboration with the approved `metadata -> token -> provider -> editor` order
- Collaboration presence is visible in the document page, and empty collaboration rooms no longer blank existing content on first connect

## Verification Evidence

- PASS: `pnpm --dir apps/api test --files tests/functional/collaboration_token_flow.spec.ts`
- PASS: `pnpm typecheck:api`
- PASS: `pnpm --dir apps/collab exec tsc --noEmit`
- PASS: `pnpm typecheck:web`
- PASS: `pnpm build:web`
- PASS: `pnpm check:workspace`
- Manual runtime verification completed:
  - two browser windows connected to the same document
  - document body synced across windows
  - minimum online presence displayed
  - save button enabled after content changes
  - empty-room seed fallback prevented the editor from turning blank after collaboration takeover

## Scope Kept

- Kept in scope:
  - shared collaboration contract
  - token sign/verify baseline
  - minimal collab runtime
  - BlockNote + Yjs collaboration baseline
- Explicitly deferred:
  - server-side collaboration persistence
  - stable snapshot pipeline
  - indexing, RAG, export, comments, and multi-node runtime concerns

## Known Limits

- `apps/collab` still uses in-memory `Y.Doc` state only
- collaboration recovery after restart still depends on current M3 fallback behavior, not true server-side restore
- `DP-1` and `DP-5` remain intentionally unrecorded because this path did not use a separate need-confirmation round or debug escalation

## Follow-Up Changes

- `feat-m4-stable-snapshot-baseline`
  - larger M4 direction for stable snapshot truth and downstream indexing input
- `feat-m4-collaboration-persistence-baseline`
  - dedicated placeholder change for:
    - `onLoadDocument` restore from database content to `Yjs`
    - `onStoreDocument` or throttled persistence from `Yjs` back to stable snapshot
    - explicit manual-save vs auto-persistence responsibility split

## Archive References

- State: [changes/feat-m3-collaboration-baseline/.spec-superflow.yaml](/D:/code-my/DocWeave/changes/feat-m3-collaboration-baseline/.spec-superflow.yaml:1)
- Audit: [changes/feat-m3-collaboration-baseline/decision-point-audit.md](/D:/code-my/DocWeave/changes/feat-m3-collaboration-baseline/decision-point-audit.md:1)
- Contract: [changes/feat-m3-collaboration-baseline/execution-contract.md](/D:/code-my/DocWeave/changes/feat-m3-collaboration-baseline/execution-contract.md:1)
