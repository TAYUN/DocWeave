# spec-superflow 工作流入口

这个目录用于承载后续每一个变更的规划工件与执行契约。

## 目录约定

每个变更都使用一个独立目录：

```text
changes/<change-name>/
├── proposal.md
├── design.md
├── tasks.md
├── specs/
│   └── <capability>.md
└── execution-contract.md
```

推荐命名方式：

- `feat-editor-ai-copilot`
- `refactor-auth-boundary`
- `chore-monorepo-bootstrap`

## 建议流程

1. 在 `changes/` 下创建新的变更目录。
2. 在 Codex 中使用 `workflow-start` 作为入口。
3. 先完成 `proposal/specs/design/tasks`，再进入 `execution-contract.md`。
4. `execution-contract.md` 获得明确批准后，再开始实现代码。

## 常用命令

```bash
spec-superflow list
spec-superflow validate changes/<change-name>
spec-superflow state init changes/<change-name>
spec-superflow state check changes/<change-name>
spec-superflow audit changes/<change-name>
node "D:\code-my\DocWeave\.agents\skills\spec-superflow-closing\scripts\close-change.mjs" "D:\code-my\DocWeave\changes\<change-name>"
```

## 与本项目文档的关系

- 变更范围、目标和边界，优先参考 `docs/decisions/` 与 `docs/architecture/`。
- 分阶段实施节奏，优先参考 `docs/planning/`。
- `changes/` 目录中的内容，表示某一次具体开发任务的增量工件。
