# M6 执行合同

## Intent Lock

- **变更名称**：`feat-m6-rag-search-chat-baseline`
- **要解决的问题**：把 M4 的稳定快照索引和 M5 的模型流能力组合成可验证的 RAG 搜索与单轮问答闭环，同时锁定块级 Citation、权限范围、共享数据契约和 HTTP streaming 边界。
- **范围内**：索引点 schema 与稳定快照预处理升级、`space_members` 唯一权限真相与 owner membership 回填、权限先裁剪的搜索与问答、active indexed version 过滤、单轮 HTTP streaming、Citation 回到当前编辑页、搜索/聊天页面及其 view-model，以及文档页的稳定快照与索引操作入口。
- **范围外**：导入导出、OCR/PDF/Office、文件 RAG、发布分享、持久化多轮 conversation、Socket.IO、复杂 rerank/知识图谱/Agent、BullMQ。

## Approved Behavior

- **已批准需求摘要**：
  1. Qdrant payload 必须包含 `workspaceId`、`spaceId`、`documentId`、`snapshotVersion`、`blockId`、`chunkId`、`headingPath`、`plainText`。
  2. API 强制认证，先得到 `RagAuthorizedDocument[]`，再按可选 `spaceId` 缩小；`packages/rag` 不读取 session、数据库权限或 `HttpContext`。
  2.1 `space_members` 是唯一的权限真相，owner 以 `role = owner` membership 表示；HTTP 与 MCP 必须复用同一 member scope resolver，不能绕过到真实检索。
  3. 检索只使用每个文档的 `latestIndexedVersion`；无有效索引版本或旧版本点不得进入结果。
  4. 搜索使用 HTTP JSON，成功响应使用 `ApiSuccessResponse<RagSearchResponse>`；chat 使用 HTTP POST streaming。
  5. 流业务事件保持 `start -> retrieval -> text-delta/citation -> finish`，错误使用 `RagStreamError`，流开始后的失败不得发送成功 `finish`。
  6. M6 只支持单轮 chat、本地页面 exchange 和 AbortController 取消，不建立持久化 conversation，也不引入 Socket.IO。
  7. Citation 回到当前编辑页并尽力定位 `snapshotVersion + blockId`，定位失败时保持页面可用并展示非致命状态。
  8. Web 通过 `apps/web/src/lib/api.ts` 消费共享 envelope，并通过 feature view-model 渲染；adapter 只做 shape 转换。
  9. 文档页必须提供可发现的“保存并创建快照”和“更新知识库”操作，并展示当前快照/索引状态；索引只表示任务已提交，完成仍由 worker 状态决定。
- **关键场景**：匿名请求返回 `401/AUTH_UNAUTHORIZED`；已存在但无 membership 的 `spaceId` 返回 `403/AUTH_FORBIDDEN` 且不调用 embedding/Qdrant/model；MCP 不得绕过 member scope；校验失败返回 `422/VALIDATION_FAILED`；无结果返回空 hits；检索或模型失败发送可重试性明确的 stream error。
- **验收检查**：覆盖索引点字段和稳定 point ID、旧 payload 不作为完整 Citation、权限先裁剪、逐文档 active version、搜索 envelope、stream 事件顺序/取消/错误、Citation best-effort 跳转和页面状态矩阵。

## Design Constraints

- **架构约束**：跨边界先过 `packages/contracts`；`packages/adapters` 只负责 Model/legacy/Qdrant/provider/transport shape 转换；`apps/api` 负责认证、权限、用例编排和 HTTP 状态码；`packages/rag` 保持框架与身份无关；页面只消费 view-model。
- **接口约束**：
  - `RagIndexBlock` 必须包含上述八个索引字段。
  - `RagRetrievalScope` 包含授权文档及其 `latestIndexedVersion`，可带 `spaceId`。
  - search 输入为 `{ searchText: string, spaceId?: string, limit?: number }`。
  - chat 输入为 `{ message: string, spaceId?: string, topK?: number }`。
  - HTTP 错误使用共享 `ApiErrorResponse`；稳定错误码使用 `AUTH_UNAUTHORIZED`、`AUTH_FORBIDDEN`、`VALIDATION_FAILED`、`RAG_RETRIEVAL_FAILED`、`RAG_GENERATION_FAILED`、`RAG_STREAM_FAILED`。
- **依赖约束**：复用 M4 稳定快照/索引任务、M5 AI SDK/AdonisJS stream adapter、现有统一异常 handler 和 `apps/web/src/lib/api.ts`；M6 不增加 Socket.IO 或 BullMQ。
- **数据约束**：历史 M4 points 必须显式重建或隔离；未满足完整 payload 的点只能作为不可 Citation 的过渡数据，不能伪造 Citation；权限真相来自 API/数据库，不来自 Qdrant payload 或前端筛选。
- **成员约束**：`space_members(space_id, user_id)` 必须唯一；已有空间必须在启用 RAG 前拥有可追溯 owner membership；不得以 `spaces` 的平行 owner 字段或 RAG 本地 allowlist 代替 membership。

## Task Batches

### Batch 1：契约与块级索引管线

- **目标**：先建立可追踪的 index-point、retrieval scope、Citation、search/chat request/response 和 stream event contracts，并完成稳定快照到 block/chunk 的预处理与 Qdrant payload 写入。
- **输入**：`docs/architecture/05. 数据契约与适配层设计.md`、M4 snapshot/index worker、M5 AI contracts/adapters、当前 `packages/contracts/src/rag.ts`。
- **输出**：更新 `packages/contracts` 的 rag/api 领域类型；新增或更新 document/rag adapters；worker 写入完整 payload 和稳定 point ID；明确并执行旧点重建/隔离策略。
- **完成标准**：契约类型通过类型检查；索引测试证明每个点可唯一映射到 document/snapshot/block/chunk；旧 payload 不会生成完整 Citation；重建策略有可重复验证证据。

### Batch 2：权限先裁剪的检索应用层与 HTTP search

- **目标**：实现认证、可见文档范围、可选 space 缩小、逐文档 active indexed version 过滤和 HTTP JSON search。
- **输入**：Batch 1 contracts/adapters；现有 auth middleware、document/space 权限服务、Qdrant client 边界。
- **输出**：RAG application service、Qdrant retrieval backend、受保护的 `/api/rag/search` controller/validator/route、共享 success/error envelope 接线。
- **完成标准**：匿名请求不调用 retrieval；未授权 `spaceId` 返回 `403/AUTH_FORBIDDEN` 且不调用 Qdrant；多文档不同 active version 的检索过滤正确；成功响应只返回授权且可追踪的 bounded hits。

### Batch 3：单轮 chat HTTP streaming

- **目标**：复用 M5 stream adapter，将授权检索上下文交给模型并输出稳定 `RagStreamEvent`。
- **输入**：Batch 1 domain/stream contracts、Batch 2 retrieval application、M5 AI runtime/fetch/AdonisJS stream patterns、`docs/architecture/35. RAG Chat 流式协议设计.md`。
- **输出**：受保护的 `/api/rag/chat`、单轮 chat application service、transport adapter、AbortController 取消处理和错误映射。
- **完成标准**：事件顺序满足 `start -> retrieval -> text-delta/citation -> finish`；模型/检索失败发送 stream error 且无成功 finish；客户端取消释放资源并恢复可用；不引入 Socket.IO。

### Batch 4：Citation 回跳与搜索/聊天页面

- **目标**：把搜索和 chat 接入 Web API wrapper、feature view-model 和当前编辑器 best-effort 定位。
- **输入**：Batch 2 search API、Batch 3 stream API、现有 document editor route/editor block state、`docs/ui/pages/p06-search.md` 和 `p07-rag-chat.md`。
- **输出**：`apps/web/src/lib/api.ts` RAG 封装、RAG feature view-model、`/search` 与 `/chat` 页面/组件、Citation 导航参数和非致命定位状态。
- **完成标准**：页面不解析 Tuyau/provider 原始 shape；覆盖 loading、empty、restricted、no-index、failed、streaming、cancelled 和 error；Citation 可回到编辑页，定位失败不阻塞结果使用；单轮 exchange 不暗示持久化历史。

### Batch 5：端到端验证与审查

- **目标**：验证 M6 主闭环和契约边界，完成批次审查。
- **输入**：Batch 1-4 实现和测试。
- **输出**：契约、API、worker、RAG、Web 的定向测试证据；代码审查记录；更新 planning/architecture 文档中的实现状态。
- **完成标准**：`pnpm` 定向检查和项目既有测试通过；关键权限、版本、stream、Citation 场景有证据；无 Socket.IO/BullMQ/import-export 越界；代码审查无未处理的高风险问题。

## Test Obligations

- **必须先从失败测试开始的行为**：index-point payload 字段与 block/chunk 映射；权限先裁剪和未授权 space 不触发 Qdrant；逐文档 active version；共享 API envelope；stream 事件顺序、错误和取消；Citation best-effort 导航。
- **必需的边界情况**：匿名请求、非法输入、无授权 space、全部可见文档、无 `latestIndexedVersion`、混合旧/新 Qdrant points、空检索、检索失败、模型失败、空流、客户端 abort、找不到 block/snapshot、重复提交和页面恢复。
- **回归敏感区域**：M4 worker/index job、M5 AI runtime/provider adapter/stream adapter、统一异常 handler、auth middleware、Tuyau/API wrapper、文档编辑器路由和 BlockNote state。

## Execution Mode

- **模式**：`SDD`
- **选择理由**：M6 横跨 contracts、adapters、worker、API、RAG 和 Web，包含权限、版本和 streaming 等跨批次契约；每个批次都必须先有失败测试，再实现并通过 review gate。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 需求已映射到 4 个实现批次和 1 个验证批次，待代码证据确认。 |
| Correctness | Pending | 关键权限、索引版本、stream 和 Citation 行为必须通过测试确认。 |
| Coherence | Pending | contracts、adapters、application、transport、view-model 的边界必须保持独立。 |

**总体结论**：Pending，DP-3 契约已批准；当前 change 已处于 `approved-for-build`，可按本合同进入实现阶段。

## Review Gates

- **强制审查点**：Batch 1 后审查数据契约和旧点策略；Batch 2 后审查权限先裁剪和 active version；Batch 3 后审查 stream wire behavior/取消/错误；Batch 4 后审查 Web view-model 与 Citation；Batch 5 做完整回归与代码审查。
- **阻塞类别**：未经 API 权限裁剪查询 Qdrant；暴露 ORM/provider/transport 原始 shape；旧点伪造 Citation；stream 顺序或错误语义漂移；引入 Socket.IO、持久化 conversation、BullMQ 或导入导出；共享 envelope/错误码不一致。

## Escalation Rules

- **何时回退到 `specifying`**：新增导入导出、文件 RAG、发布分享、多轮 conversation、Socket.IO/BullMQ，或改变 Citation 视图、权限真相、索引点核心字段等已批准范围。
- **何时回退到 `bridging`**：contracts、stream transport、权限输入、批次依赖或完成标准发生变化，导致本执行合同不再匹配 planning 工件。
- **何时不得继续实现**：当前合同或 planning 工件未重新批准；任何匿名/越权请求会触发检索；关键契约类型未从 `@docweave/contracts/<domain>` 导入；定向测试失败且未经过 bug-investigator；发生未授权的范围扩展。
