# 执行合同

## Intent Lock

- **变更名称**：`feat-m5-editor-ai-baseline`
- **要解决的问题**：在 M4 文档协同与持久化基础上，接入 BlockNote 官方编辑器 AI 协议，形成文档页动作式 AI 的流式生成、工具应用和协同持久化闭环。
- **范围内**：`@blocknote/xl-ai` 前端扩展；`@blocknote/xl-ai/server` + AI SDK Data Stream Protocol；选区、Slash、toolbar 入口；五类基础动作；权限、只读态、取消和失败恢复；通过现有 editor/Yjs 应用结果。
- **范围外**：侧边 Chat UI、多轮 Copilot、RAG、Citation、整篇自动改写、复杂 Agent、AI 计费审计和复杂协同冲突解决。

## Approved Behavior

- **已批准需求摘要**：使用官方 `AIExtension`、`AIMenuController`、`AIToolbarButton`、`getAISlashMenuItems`，API 接收官方 messages/toolDefinitions，调用 `injectDocumentStateMessages` 和 `toolDefinitionsToToolSet`，通过 `streamText` 返回兼容 BlockNote 的 UI message data stream。
- **关键场景**：选区改写/翻译；Slash 扩写/总结；toolbar 触发基础动作；生成中停止；只读用户只能生成建议不能应用；应用结果进入当前 BlockNote/Yjs 实例。
- **验收检查**：三类入口可用；rewrite/expand/shorten/translate/summarize 可触发；流式返回可消费；请求可取消；未认证/无权限被拒绝；provider 失败可恢复；Web/API 类型检查和功能测试通过。

## Design Constraints

- **架构约束**：`apps/api` 负责认证、文档权限和协议宿主；`packages/ai` 负责 provider/model runtime；`packages/document` 不承担编辑器 AI 交互；`packages/rag` 不进入 M5 主链路。
- **接口约束**：不得用纯文本自定义接口替代 BlockNote 官方工具协议；Response 必须兼容 AI SDK UI Message Data Stream；API 不直接修改 `documents.content`。
- **依赖约束**：统一使用 Vercel AI SDK 6（`ai@^6.0.224`、`@ai-sdk/openai@^3.0.84`），与 `@blocknote/xl-ai@0.51.4` 对齐；不在 M5 强行升级到 AI SDK 7；服务端 key 只在 API/worker；接受 `@blocknote/xl-ai` GPL-3.0；依赖版本与当前 BlockNote `0.51.x` 主版本兼容。
- **数据约束**：服务端用 session 和 documentId 再次确认权限；业务上下文限制为标题、选区、当前块和有限邻近块；M5 不调用 RAG；应用结果继续由现有 Yjs 和 M4 运行态持久化观察。
- **文档处理约束**：`packages/document` 只提供无数据库、无权限、无 RAG 的 BlockNote local context builder；不得把 M5 上下文处理散落到 controller。

## Task Batches

### Batch 1

- **目标**：建立共享 editor AI contract 和可被 `streamText` 使用的模型 factory。
- **输入**：现有 `packages/contracts/src/ai.ts`、`packages/ai` provider runtime。
- **输出**：action/error/context contract、chat model factory、fake model test、必要依赖。
- **完成标准**：runtime package tests 先红后绿；API 能取得 LanguageModel；不影响现有 embedding 流程。

### Batch 2

- **目标**：将 API editor endpoint 接入官方 server tools、认证、文档权限和 UI message stream。
- **输入**：Batch 1 runtime、现有 auth/capability 和 document service。
- **输出**：受保护的 `/api/ai/editor`、editor AI service、官方 payload validation、功能测试。
- **完成标准**：未认证和无权限请求不触发模型；合法请求返回 BlockNote-compatible stream；错误和 abort 可验证。

### Batch 3

- **目标**：把官方 AI extension 和三类入口接入当前单人/协同编辑器。
- **输入**：Batch 2 endpoint、现有 `DocumentEditor` props 和 collaboration capability。
- **输出**：AIExtension、AI menu controller、toolbar button、Slash items、transport 和只读应用边界。
- **完成标准**：Web typecheck/build 通过；AI 工具调用通过当前 editor/Yjs 应用；不新增侧边 Chat UI。

### Batch 4

- **目标**：完成 M5 回归、文档同步和 review 收口。
- **输入**：Batch 1-3 实现与回归清单。
- **输出**：功能/集成测试、M5 文档更新、review 证据。
- **完成标准**：五动作、三入口、流式取消、权限、provider failure、只读和协同应用均有验证；change 可进入 closing。

## Test Obligations

- **必须先从失败测试开始的行为**：AI model factory、未认证/无权限 endpoint、官方 payload stream、Web AI extension wiring、只读应用限制。
- **必需的边界情况**：空选区、无选区 Slash、缺失 provider key、模型超时、用户 abort、 malformed stream、协同断线后应用、无权限 documentId。
- **回归敏感区域**：现有文档编辑、BlockNote/Yjs 协同、M4 自动持久化、API response envelope、Tuyau registry 类型和 worker embedding runtime。

## Execution Mode

- **模式**：`SDD`
- **选择理由**：跨 Web/API/editor/AI/contracts 多模块，包含新增依赖、流式协议、认证边界和协同应用语义；需要按批次实现并独立 review。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 需完成四批实现与 M5 回归 |
| Correctness | Pending | 需验证官方 Data Stream Protocol 和权限边界 |
| Coherence | Pending | 需确认 AI 应用不破坏 M4 Yjs/持久化职责 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：Batch 1 runtime review；Batch 2 API/protocol/security review；Batch 3 editor UX/collaboration review；Batch 4 final spec compliance review。
- **阻塞类别**：官方协议不兼容、未认证可调用、模型 key 泄漏、AI 直接写数据库、只读用户能应用、破坏既有协同或 M4 测试。
- **额外阻塞类别**：AI SDK 主版本与 BlockNote 官方包不匹配；AdonisJS response adapter 丢失 UI message stream headers/body；请求缺少 documentId/action/toolDefinitions 边界；目标 block 已变化仍被强制应用。

## Implementation Evidence

- Batch 1-4 completed with AI SDK 6 runtime, official BlockNote protocol host, Web editor entries, bounded document context, permission regression, M4 regression, and Web/API build verification.

## Escalation Rules

- **何时回退到 `specifying`**：官方 BlockNote API 与当前设计不兼容，或需要引入新的产品能力、协议或 Chat UI。
- **何时回退到 `bridging`**：依赖版本、AdonisJS streaming response 或 AI SDK model factory 无法按 contract 接通，需要重新调整架构接口。
- **何时不得继续实现**：任何未经 contract 批准的范围扩展；生产代码缺少对应失败测试；权限、密钥安全或协同正文真相出现未解决风险。
