# spec-superflow 工作流接入说明

本文档用于说明 `DocWeave` 当前如何使用 `spec-superflow` 组织后续开发。
它是工作流入口文档：负责说明阶段、工件、进入方式，以及在本仓库中的实际用法。

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

## 完整阶段

在 `DocWeave` 中，`spec-superflow` 的完整主线阶段如下：

1. `exploring`
2. `specifying`
3. `bridging`
4. `approved-for-build`
5. `executing`
6. `closing`

可以简单理解为：

- `exploring`：澄清需求和边界
- `specifying`：沉淀 proposal / specs / design / tasks
- `bridging`：从规划工件生成 `execution-contract.md`
- `approved-for-build`：contract 已获批准，允许进入实现
- `executing`：按 contract 真正实现、验证、修正
- `closing`：完成验证、补齐审计与归档工件

## 每个阶段的核心产物

- `exploring`：稳定的 change 意图与范围
- `specifying`：`proposal.md`、`specs/`、`design.md`、`tasks.md`
- `bridging`：`execution-contract.md`
- `approved-for-build`：已批准 contract 与已记录的执行模式
- `executing`：代码实现、验证结果、进度记录
- `closing`：更新后的 `.spec-superflow.yaml`、`decision-point-audit.md`、已收口的 `tasks.md`

## 实现阶段怎么走

当 change 进入实现期时，实际遵循的是：

1. 先有被批准的 `execution-contract.md`
2. 再按 contract 里的 batch 顺序实现
3. 每个 batch 完成后做类型检查、构建或场景验证
4. 实现收口后再进入 `closing`

当前仓库里，很多 change 使用的是 `Batch Inline`，也就是：

- 不额外拆成更重的 SDD 子流程
- 直接在当前线程里按 batch 顺序推进
- 但仍然要保留验证和执行痕迹

## 收口阶段怎么走

当 change 已实现完成，不要直接口头宣布结束，而是进入 `closing` 收口。

收口时请直接参考：

- [spec-superflow Closing SOP](D:/code-my/DocWeave/docs/workflow/spec-superflow-closing-sop.md)
- [close-change.ps1](D:/code-my/DocWeave/tools/spec-superflow/close-change.ps1)

这份 SOP 记录了本仓库里真正会卡住 closing 的几个关键步骤。
如无特殊情况，优先直接运行 `close-change.ps1`，而不是手工跳过其中某一步。

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

## 本仓库里的注意事项

结合当前 `DocWeave` 的实际使用情况，下面几条特别重要：

1. `tasks.md` 如果还有 `- [ ]`，`executing -> closing` 会被 guard 拦住。
2. `.spec-superflow.yaml` 里的 `test_result` 要写成精确的 `pass`，不要写成 `passed: ...`。
3. 修改过 `proposal.md`、`specs/`、`design.md`、`tasks.md` 后，要先执行 `ssf state rebuild "<change-dir>"`，否则 `contract-fresh` 可能失败。
4. 执行 `ssf state transition` 时，优先使用绝对路径，避免相对路径在 guard 里被误判。
5. 进入 `closing` 时，优先执行：

```powershell
powershell -ExecutionPolicy Bypass -File "D:\code-my\DocWeave\tools\spec-superflow\close-change.ps1" "D:\code-my\DocWeave\changes\<change-name>"
```

这样可以同时检查 `tasks.md` 是否全部勾完、`.spec-superflow.yaml` 是否补齐关键字段，并刷新审计报告。

## 推荐首批动作

如果下一步要正式进入开发，建议先创建一条真正的初始化变更，例如：

- `changes/chore-monorepo-bootstrap/`
- `changes/feat-editor-foundation/`

随后从 `workflow-start` 正式开始，而不是直接跳到写代码阶段。
