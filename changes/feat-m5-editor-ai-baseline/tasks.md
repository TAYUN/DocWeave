# 实现任务

## File Structure

- `Modify: packages/contracts/src/ai.ts` — 增加编辑器 AI action、上下文与错误语义。
- `Modify: packages/ai/src/index.ts` — 增加可供 AI SDK `streamText` 使用的 chat model factory。
- `Modify: packages/ai/package.json` — 增加 BlockNote server AI 运行时依赖边界。
- `Modify: packages/editor/package.json` — 接入 `@blocknote/xl-ai` 与 AI SDK transport 依赖。
- `Modify: packages/editor/src/document-editor.tsx` — 注册 AIExtension、官方 AI menu/controller 和 toolbar/slash 入口。
- `Modify: apps/web/src/pages/documents/document-editor-page.tsx` — 向编辑器传递 API endpoint、文档权限和 AI 配置。
- `Modify: apps/web/package.json` — 接入编辑器 AI 运行时依赖。
- `Modify: apps/api/start/env.ts` — 增加服务端 AI provider 配置。
- `Modify: apps/api/start/routes.ts` — 认证保护编辑器 AI endpoint。
- `Modify: apps/api/app/validators/runtime.ts` — 校验官方 BlockNote AI 请求外壳和业务限制。
- `Modify: apps/api/app/controllers/ai_editor_controller.ts` — 接入官方 server tools、streamText 和权限服务。
- `Create: apps/api/app/services/editor_ai_service.ts` — 收口文档权限、上下文边界和 system prompt。
- `Create: apps/api/tests/functional/editor_ai_flow.spec.ts` — 覆盖认证、权限、流式响应和错误边界。
- `Create: packages/ai/src/index.test.ts` — 覆盖 chat model factory 的配置与 fake runtime。
- `Modify: docs/planning/21. M5 编辑器 AI 实施文档.md` — 同步官方协议和 toolbar 边界。
- `Modify: docs/planning/42. 编辑器 AI 回归清单.md` — 增加官方工具流、取消和协同应用回归项。
- `Modify: docs/architecture/20. AI 模块设计.md` — 固化 `packages/ai` streaming model factory 与 provider 版本策略。
- `Modify: docs/architecture/22. BlockNote 服务端能力接入设计.md` — 固化 AdonisJS response adapter、AI SDK 6 兼容边界和官方 server handler 落点。
- `Modify: docs/architecture/23. 编辑器 AI 集成设计.md` — 固化三类入口、结果应用门禁和协同 stale 状态规则。

## Interfaces

### Web -> API

- `POST /api/ai/editor`
- Request：BlockNote AI UI message payload，包括 `messages`、`toolDefinitions` 和官方 document state metadata。
- Response：AI SDK UI Message Data Stream，必须可被 `DefaultChatTransport` 消费。

### API -> AI runtime

- `getEditorAiModel(): LanguageModel`
- API 通过 `streamText` 调用，不把 provider key 暴露给 Web。

### API -> BlockNote server tools

- `injectDocumentStateMessages(messages)`
- `toolDefinitionsToToolSet(toolDefinitions)`
- `aiDocumentFormats.html.systemPrompt`

## 1. Batch 1: 依赖、共享 contract 与 runtime streaming

- **Depends on**: Batch 0
- 先写 `packages/ai` 配置与 model factory 的失败测试。
- 增加 `EditorAiAction`、错误码和上下文边界 contract。
- 接入 `@blocknote/xl-ai/server` 和 `streamText` 所需依赖。
- 实现 fake 可替换的 editor AI model factory。
- 运行 package tests 与 API/Web typecheck。
- 明确 `@blocknote/xl-ai@0.51.4` 使用 `ai@6`、`@ai-sdk/openai@3`，不强行 override 到 AI SDK 7。
- 明确 `packages/document` 的 M5 责任仅为无数据库、无权限、无 RAG 的 BlockNote local context builder。

## 2. Batch 2: API 官方协议宿主与权限

- **Depends on**: Batch 1
- 先写未认证、无权限和官方 payload 的失败功能测试。
- 将 `/api/ai/editor` 纳入认证边界。
- 使用 editor AI service 读取文档并校验访问/编辑能力。
- 使用 BlockNote server helpers 注入文档状态、转换工具并调用 `streamText`。
- 返回兼容 `toUIMessageStreamResponse` 的流式 response，并覆盖 abort/error。
- 增加 AdonisJS response adapter，转发 status、headers、body stream，并保留 Data Stream Protocol content type。
- 增加文档 capability 校验：用户、documentId、可读能力和可编辑能力必须在服务端重新确认。
- 增加编辑器 AI request contract：官方 `messages`、`toolDefinitions`、document state，以及 `documentId`、action metadata 的校验边界。

## 3. Batch 3: Web 编辑器入口与结果应用

- **Depends on**: Batch 2
- 先写 editor integration 的最小类型/渲染失败检查。
- 注册 `AIExtension` 和 `DefaultChatTransport`。
- 接入 `AIMenuController`、`AIToolbarButton`、`getAISlashMenuItems`。
- 将只读 capability 传入编辑器并禁止应用修改。
- 确认工具应用使用当前 BlockNote/Yjs 实例。
- 生成开始时记录 editor instance、documentId、协同连接状态和目标 block IDs。
- 应用前重新检查 editor 未销毁、仍可编辑、协同状态允许应用且目标 blocks 仍存在；否则拒绝应用。
- 明确 AI 结果不调用 `PATCH /documents/:id`，由 BlockNote/Yjs change 进入 M4 自动持久化。

## 4. Batch 4: 回归、文档与收口

- **Depends on**: Batch 3
- 补齐五个动作、三类入口、流式取消、权限、provider failure 和协同应用回归。
- 更新 M5 planning 与编辑器 AI 回归清单。
- 运行 API 功能测试、AI package tests、Web build/typecheck。
- 执行独立 code review，确认无侧边 Chat、RAG 或多轮 Copilot 越界。
- 逐项验证官方接入、流式契约、request contract、API 权限、协同应用语义和 packages/document 责任边界。

## Completion Evidence

- [x] Batch 1: AI SDK 6 runtime、LanguageModel factory、editor AI contracts。
- [x] Batch 2: AdonisJS official protocol host、stream adapter、认证和文档准入。
- [x] Batch 3: AIExtension、selection/Slash/toolbar 入口和协同断线门禁。
- [x] Batch 4: 文档同步、专项测试、M4 回归、Web/API build 和 review。
