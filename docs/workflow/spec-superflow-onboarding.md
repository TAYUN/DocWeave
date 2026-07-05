# spec-superflow 工作流接入说明

本文档用于说明 `DocWeave` 当前如何使用 `spec-superflow` 组织后续开发。

## 当前接入状态

项目已完成以下基础初始化：

1. 根目录存在 `.spec-superflow.yaml`，作为工作区入口标记。
2. 根目录存在 `spec-superflow.config.json`，用于保存项目级默认配置。
3. Codex 已安装并启用 `spec-superflow` 插件。
4. 仓库已创建 `changes/` 目录，作为后续增量变更入口。

## 当前默认配置

当前项目配置如下：

- `verification.language = zh`
- `execution.defaultLanguage = zh`

这意味着后续由 `spec-superflow` 生成或校验的工作流内容，会默认偏向中文语境，更适合当前项目协作方式。

## 推荐使用方式

当要开始一个新功能、重构或跨模块调整时：

1. 在 `changes/` 下创建一个新的变更目录。
2. 在 Codex 中输入：`Use workflow-start to start a new change.`
3. 按工作流顺序推进：
   - `proposal.md`
   - `specs/`
   - `design.md`
   - `tasks.md`
   - `execution-contract.md`
4. 在 `execution-contract.md` 明确批准后，再进入实现阶段。

## 目录命名建议

建议使用短横线命名，并让名称能直接表达目标：

- `feat-document-sharing`
- `feat-editor-comment-thread`
- `refactor-storage-boundary`
- `chore-infra-bootstrap`

## 与现有文档体系的配合

- `docs/decisions/` 负责全局基线，不应被单次变更目录覆盖。
- `docs/architecture/` 负责系统边界和核心设计，是变更设计的重要上游输入。
- `docs/planning/` 负责阶段节奏与实施顺序，可作为拆分 `tasks.md` 的依据。
- `docs/workflow/` 负责工作流接入、流程说明与收口 SOP。
- `changes/` 只记录某次具体变更的增量工件和执行契约。

## 推荐首批动作

如果下一步要正式进入开发，建议先创建一条真正的初始化变更，例如：

- `changes/chore-monorepo-bootstrap/`
- `changes/feat-editor-foundation/`

随后从 `workflow-start` 正式开始，而不是直接跳到写代码阶段。
