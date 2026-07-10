---
name: project-issue-journal
description: Use when the user wants to record high-value development problems, hidden blind spots, repeated work, or retrospective material for DocWeave. Apply this skill to extract the problems that materially affect decisions and execution, surface the important points the user did not fully notice, summarize repetitive work patterns, and write them into `docs/tem/项目开发问题记录.md`.
---

# Project Issue Journal

Use this skill whenever the user wants to:

1. 记录项目开发过程中遇到的问题。
2. 找出自己没有完全意识到、但会显著影响决策和工作的关键点。
3. 梳理重复性工作，方便后续复盘、总结、写文章或准备面试。

## Workflow

1. Read [references/recording-rules.md](./references/recording-rules.md) before adding or changing entries.
2. When the user wants a ready-to-copy prompt, point them to [references/usage-templates.md](./references/usage-templates.md).
3. Inspect the current project state and the recent task context first. Do not write generic advice that is disconnected from the actual repository or session.
4. Extract two layers of价值信息：
   - 明面问题：用户已经明显遇到、已经表达出来的问题。
   - 隐性关键点：用户没有完整意识到，但会显著影响后续决策、效率、稳定性或协作质量的问题。
5. Explicitly look for repeated work patterns, especially:
   - 反复手动修同一类边界问题
   - 重复解释同一套架构职责
   - 多次排查环境/数据基线问题
   - 多次整理提交边界、流程状态、生成产物或脚本问题
6. Write or update [`docs/tem/项目开发问题记录.md`](D:/code-my/DocWeave/docs/tem/%E9%A1%B9%E7%9B%AE%E5%BC%80%E5%8F%91%E9%97%AE%E9%A2%98%E8%AE%B0%E5%BD%95.md).
7. Prefer appending or refining existing categories over creating a brand-new taxonomy every time.

## Project Rules

1. Always record repository-specific problems, not abstract methodology filler.
2. Treat “用户没有完全意识到的关键点” as first-class output. If a hidden issue materially affects architecture, workflow, environment, review quality, or delivery speed, write it down even if the user did not name it directly.
3. Treat “重复性工作” as a signal of missing automation, missing boundaries, missing defaults, or missing documentation. Do not only list the repeated动作；also state what that repetition implies.
4. When a problem is still unresolved, mark the current state clearly instead of pretending it is already closed.
5. Keep the document useful for long-term retrospective reading: each entry should explain why the issue matters, not just what happened.

## Output Expectations

1. Update the journal file directly instead of only describing what should be recorded.
2. Use second-level headings for problem categories and stable numbered subheadings for entries.
3. For each new entry, capture at least:
   - 背景
   - 暴露方式
   - 影响
   - 当前结论
   - 值得复盘的问题
4. If you discover a hidden but high-impact blind spot, call it out explicitly in the final response instead of burying it inside the document.
