# M5 编辑器 AI 最小闭环

## Why

DocWeave 已完成 M4 的协同持久化、稳定快照和索引基线，文档页现在具备稳定的 BlockNote 编辑器与协同写入边界。下一阶段需要在不引入侧边多轮聊天、RAG 或 Copilot 的前提下，把动作式编辑器 AI 接入文档页，形成“触发动作、流式生成、用户确认、应用回编辑器”的最小闭环。当前已有的 AI runtime 只覆盖通用文本生成和 embedding，API 中的编辑器 AI 端点仍是占位实现，前端也尚未接入 BlockNote AI 扩展，因此需要通过官方 BlockNote AI 协议补齐这一条链路。

## What Changes

- 使用 `@blocknote/xl-ai` 的 `AIExtension`、选区菜单、toolbar 按钮和 Slash 菜单入口。
- 使用 `@blocknote/xl-ai/server` 的官方文档工具协议，在 `apps/api` 中接入 AI SDK Data Stream Protocol。
- 扩展 `packages/ai`，提供编辑器 AI 所需的流式模型能力和配置边界。
- 在 `apps/api` 中校验当前用户、目标文档访问权限、编辑能力和请求上下文。
- 保留标题、选区、当前块和邻近块作为编辑器 AI 的上下文范围，不引入 RAG。
- 让 AI 工具调用经过 BlockNote 客户端正常应用，继续进入现有 Yjs 协同和 M4 自动持久化链路。

## Capabilities

### 新增能力

- editor-ai-streaming
- editor-ai-blocknote-official-protocol
- editor-ai-action-entries

### 修改能力

- blocknote-web-editor-baseline
- ai-runtime-baseline

## Scope

### In Scope

- 选区入口、Slash 入口、toolbar 入口。
- BlockNote 官方 AI 工具协议和 Data Stream Protocol。
- 改写、扩写、缩写、翻译、总结五类动作。
- 当前用户与目标文档权限校验。
- 流式返回、停止生成、失败恢复。
- 只读状态下禁止应用文档修改。
- AI 工具调用应用后复用现有协同正文链路。
- 单元、功能和最小手工回归验证。

### Out of Scope

- 侧边多轮聊天面板。
- 独立 Chat UI 主线改造。
- 文档 Copilot、多轮会话和会话持久化。
- RAG 检索增强、Citation 和知识库上下文。
- 整篇文档自动改写和复杂 Agent 工作流。
- AI 审计、额度、计费和多模型路由中心。
- 多人同时修改同一 AI 结果的复杂冲突解决。

## Impact

- 代码区域：`apps/web`、`apps/api`、`packages/editor`、`packages/ai`、`packages/contracts`。
- 依赖区域：`@blocknote/xl-ai`、`@blocknote/xl-ai/server` 与 AI SDK streaming 依赖。
- 数据边界：AI 不直接修改数据库正文；应用结果继续经 Yjs 和 M4 运行态持久化。
- 文档边界：补充 M5 设计、官方 API 验证记录、执行任务和回归证据。
