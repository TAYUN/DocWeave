# spec-superflow 工作流入口

这个目录用于承载后续每一个变更的规划工件与执行契约。

## 目录约定

每个变更都使用一个独立目录：

```text
changes/<change-name>/
├── proposal.md
├── design.md
├── HANDOFF.md
├── HANDOFF_RESULT.md
├── PROGRESS.md
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

## 什么时候值得用 HANDOFF / 续跑机制

推荐在下面这些场景补充使用 `HANDOFF.md`、`HANDOFF_RESULT.md` 或 `PROGRESS.md`：

- 改动预计超过半小时，且会跨多个阶段推进。
- 需求涉及方案澄清、设计取舍、任务拆解和分批实现。
- 你预计会中途切换 session、切换 agent，或需要把实验结果回注主流程。

下面这些场景通常不必专门引入这套交接机制：

- 单文件修补、局部样式微调、小范围文案修改。
- 明确知道怎么改，且可以在一个短会话里完成的任务。

## 跨 session 与续跑模板

当 change 需要暂停、交接或在新 session 里恢复时，优先复用：

- [HANDOFF.md](D:/code-my/DocWeave/changes/templates/HANDOFF.md)：记录暂停原因、实验边界和期望产出。
- [HANDOFF_RESULT.md](D:/code-my/DocWeave/changes/templates/HANDOFF_RESULT.md)：记录实验结论与建议回写点。
- [PROGRESS.md](D:/code-my/DocWeave/changes/templates/PROGRESS.md)：记录当前状态、已完成项、卡点和下一步。

推荐做法：

1. 主 session 暂停前，先更新 `proposal.md`、`design.md`、`tasks.md` 和 `.spec-superflow.yaml`。
2. 复制 `HANDOFF.md` 或 `PROGRESS.md` 到当前 change 目录，再补齐本次上下文。
3. 新 session 进入 change 目录后，先运行 `workflow-start`，再结合交接文件继续。

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
