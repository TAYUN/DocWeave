---
name: spec-superflow-closing
description: Use when a DocWeave change is entering spec-superflow closing, when the user asks to close/archive/audit a change, or when tasks/state/audit may have drifted after implementation. Apply this skill to enforce the repository closing SOP, sync tasks.md with execution reality, rebuild state with absolute paths, run state check, and refresh decision-point audit before declaring the change complete.
---

# spec-superflow Closing

Use this skill whenever a `changes/<change-name>` task is ready to move from implementation into `closing`.

## Workflow

1. Read [references/closing-sop.md](./references/closing-sop.md) before changing closing artifacts.
2. Confirm verification has already been rerun for the change. If verification is missing, run it first and do not close early.
3. Sync `tasks.md` with reality. `closing` 前不允许保留任何 `- [ ]`。
4. Check `.spec-superflow.yaml` for closing-critical fields:
   - `test_result: pass`
   - required `dp_*` records already written for the executed path
5. Run the skill script instead of manually stitching the closing commands:

```powershell
node "D:\code-my\DocWeave\.agents\skills\spec-superflow-closing\scripts\close-change.mjs" "D:\code-my\DocWeave\changes\<change-name>"
```

6. Read the script output. If it fails, report the exact missing prerequisite instead of hand-waving the close.
7. Only after the script succeeds, treat `decision-point-audit.md` and `.spec-superflow.yaml` as the current closing truth.

## Project Rules

1. Always use absolute Windows paths for `ssf state rebuild`, `ssf state check`, and `ssf audit`.
2. Prefer the skill script [`scripts/close-change.mjs`](./scripts/close-change.mjs) over ad hoc commands.
3. If `DP-5` was never used because there was no debug escalation, leaving it unrecorded is acceptable; do not invent a fake debug record.
4. If `audit` disagrees with `.spec-superflow.yaml`, refresh `audit` after rebuild/check before claiming the change is inconsistent.
5. If the script succeeds but `tasks.md` or audit artifacts changed, include those updated files in Git so the closing state is reproducible.

## Output Expectations

1. State whether closing is blocked or complete.
2. Cite which file or prerequisite caused the block when the wrapper fails.
3. Do not say a change is fully closed until `tasks.md`, `.spec-superflow.yaml`, and `decision-point-audit.md` are in sync.
