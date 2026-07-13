# M5 编辑器 AI 设计

## Context

M4 已建立 BlockNote 文档、Yjs 协同、`documents.content` 自动持久化和稳定快照边界。当前 `packages/ai` 已通过 Vercel AI SDK 封装 DashScope OpenAI-compatible provider，但只有非流式 `generateText` 和 embedding 入口；`apps/api/app/controllers/ai_editor_controller.ts` 仍为占位接口，`packages/editor` 和 `apps/web` 没有 BlockNote AI 扩展。

官方 BlockNote 文档确认，默认后端接入需要接收 `messages` 与 `toolDefinitions`，使用 `injectDocumentStateMessages`、`toolDefinitionsToToolSet`、`aiDocumentFormats`，并通过 `streamText(...).toUIMessageStreamResponse()` 返回 Data Stream Protocol。前端使用 `AIExtension`、`AIMenuController`、`AIToolbarButton` 和 `getAISlashMenuItems`。

## Goals

- 建立官方 BlockNote AI 协议兼容的端到端流式闭环。
- 保持文档页动作式 AI，不引入侧边多轮 Chat UI。
- 将权限、provider 配置和错误收敛在 API / AI runtime 边界。
- 让 AI 工具调用继续走当前编辑器实例、Yjs 协同和 M4 持久化链路。
- 用可测试的 contract 和回归清单锁定 M5 边界。

## Decisions

### 1. 采用 BlockNote 官方 AI 工具协议

- **Choice**：使用 `@blocknote/xl-ai` 的默认 transport、AI extension 和工具调用协议；API 使用 `@blocknote/xl-ai/server` 的工具转换与文档状态注入。
- **Rationale**：BlockNote 客户端需要工具调用来安全修改 block 文档，不能用一个只返回纯文本的自定义 endpoint 替代。
- **Alternative**：自定义 `instruction -> text` API。放弃原因是无法复用官方选区、光标、block ID 和工具应用机制。

### 2. API 返回 UI Message Data Stream

- **Choice**：`apps/api` 使用 AI SDK `streamText`，返回 `result.toUIMessageStreamResponse()` 语义；AdonisJS 只负责认证、权限、请求读取和响应转发。
- **Rationale**：这是官方 BlockNote AI 兼容协议，支持工具调用、文本增量和客户端自动处理。
- **Alternative**：自定义 SSE event。仅在官方协议无法嵌入 AdonisJS 时作为退路；M5 首版不采用。

### 3. `packages/ai` 暴露 language model，不暴露业务权限

- **Choice**：AI runtime 增加 `getChatModel()` 或等价的 provider model factory，并保留 `generateText` / `embedMany`；API 负责创建场景 prompt、权限和 BlockNote server tools。
- **Rationale**：官方 `streamText` 需要一个 AI SDK language model，而不是已经执行完的文本结果。
- **Alternative**：让 controller 直接创建 provider。放弃原因是会绕开既有统一模型配置边界。

### 4. 编辑器上下文以官方 document state 为主，业务上下文受限

- **Choice**：信任前端用于编辑体验的消息状态，但服务端必须用 session 和 `documentId` 重新确认文档访问权限；业务补充上下文最多包含标题、当前 block 和有限邻近 block，不引入 RAG。
- **Rationale**：BlockNote 官方协议已经传递 selection/cursor/block IDs；服务端不能把任意前端正文当成权限事实，也不能在 M5 提前耦合 RAG。
- **Alternative**：每次请求读取整篇文档并发送给模型。放弃原因是上下文无界、成本更高且与局部动作目标冲突。

### 5. AI 结果应用继续走编辑器和协同链路

- **Choice**：API 不直接写 `documents.content`；BlockNote 客户端工具调用在当前 editor/Yjs 实例执行，应用结果由现有协同持久化观察。
- **Rationale**：避免 AI 产生第二份正文真相，保持 M4 的职责分离。
- **Alternative**：API 生成后直接更新文档。放弃原因是会绕过 Yjs、破坏协同状态和选区定位。

### 6. M5 动作映射使用官方 custom commands 扩展

- **Choice**：保留官方 AI 菜单与工具链，使用自定义 command/prompt 将产品动作映射为 rewrite、expand、shorten、translate、summarize；翻译动作要求明确目标语言输入。
- **Rationale**：官方入口负责 selection/slash/toolbar，产品语义只在 command 层扩展，避免重写 UI。
- **Alternative**：另造 Mantine AI 弹窗和文本替换器。放弃原因是重复实现官方交互和 block 应用逻辑。

## Risks And Trade-Offs

- `@blocknote/xl-ai` 为 GPL-3.0，项目已接受该许可；依赖必须在 package manifest 和许可证记录中明确。
- AdonisJS 不是官方示例中的 Next.js，需要建立 Request/Response 到 AdonisJS streaming response 的适配测试。
- BlockNote 官方 AI 默认是工具调用驱动，不是简单的五个 HTTP action；M5 的“动作”应落在 prompt/command 语义层。
- 复杂协同冲突不在 M5 范围内；但应用必须使用当前 editor 实例，不能绕过协同。
- AI provider 真实调用需要环境变量；自动化测试必须使用可替换的 fake language model，不能依赖外网模型。

## Official Validation Record

来源：BlockNote 官方文档 `https://www.blocknotejs.org/docs/features/ai/getting-started` 和 `https://www.blocknotejs.org/docs/features/ai/backend-integration`，2026-07-12 核对。

已确认：`AIExtension`、`AIMenuController`、`AIToolbarButton`、`getAISlashMenuItems`、`DefaultChatTransport`、`injectDocumentStateMessages`、`toolDefinitionsToToolSet`、`aiDocumentFormats` 和 `toUIMessageStreamResponse` 是官方默认接入链路；BlockNote AI 要求 Data Stream Protocol。
