# M6 RAG 搜索与问答设计

## Context

M4 已建立稳定快照、索引任务、Worker、embedding 和 Qdrant 写入基线。M5 已建立 Vercel AI SDK 流式模型能力、AdonisJS 流式响应适配和前端 AI 消费经验。M6 的目标是把这些基础能力组合成真实的搜索与单轮问答闭环。

当前存在四个直接阻塞：

1. M4 写入的 Qdrant payload 只有 `documentId`、`snapshotVersion`、`chunkIndex` 和文本，无法稳定生成 block 级 Citation。
2. RAG 路由还未纳入认证和用户可见文档范围计算。
3. `packages/rag` 还没有真实 Qdrant retrieval backend，API 仍返回同步占位 JSON。
4. 搜索页、聊天页和 Citation 回跳还没有真实页面契约。

M6 只做稳定快照上的搜索与单轮问答，不包含导入导出、文件 RAG、发布分享、持久化多轮 conversation 或队列升级。

## Goals

1. 为稳定快照建立可追踪的 block-aware 索引点 schema。
2. 让 API 在检索前计算当前用户的可见文档范围。
3. 让 `packages/rag` 在授权范围内完成 Qdrant 检索和上下文组装。
4. 复用 M5 的 HTTP streaming 基础完成单轮 RAG chat。
5. 让 Citation 能回到当前文档编辑页，并提供非致命的 best-effort 定位。
6. 让搜索页和聊天页拥有可直接实现的 view-model 和状态契约。
7. 保持 contracts、adapters、application/service 和 UI view-model 的边界清晰。
8. 遵循 `docs/architecture/05. 数据契约与适配层设计.md` 的 contract、adapter、Tuyau、API wrapper 和 view-model 分层。

## Decisions

### Decision 1: Use a block-aware index point schema

**Choice**：每个 Qdrant point 的业务 payload 固定包含：

```text
workspaceId
spaceId
documentId
snapshotVersion
blockId
chunkId
headingPath
plainText
```

`chunkIndex` 可以作为实现辅助字段保留，但不替代 `chunkId`。Point ID 使用由 `documentId + snapshotVersion + chunkId` 生成的稳定 ID。

**Rationale**：Citation、权限辅助过滤、结果展示和后续定位都需要稳定来源元数据。M4 的旧 payload 不满足这一要求，因此 M6 必须把 schema 升级和重新索引策略纳入 planning/build 边界。

**Alternatives considered**：

- 继续只保存纯文本和 `chunkIndex`：实现最小，但无法可靠回到 block，也无法支撑 Citation 要求。
- 只在检索命中后重新读取 snapshot 推断 block：会增加复杂度，且 chunk 与 block 的映射可能不可逆。

### Decision 2: Permission-first retrieval with optional space narrowing

**Choice**：`apps/api` 强制认证，并先计算当前用户的 `allowedDocumentIds`；只有经过授权的范围才会传入 `packages/rag`。如果请求包含 `spaceId`，只能在授权范围内进一步缩小结果。

```text
session user
  -> permission service
  -> allowedDocumentIds
  -> optional spaceId narrowing
  -> packages/rag retrieval
  -> Qdrant filter
```

前端的“当前空间 / 全部可见文档”只是检索体验选项，不是权限真相。

**Rationale**：Qdrant payload 只能作为检索过滤辅助，不能替代 PostgreSQL 中的业务权限。先裁剪再过滤可以避免把未经授权的 `spaceId` 或 payload 直接作为安全边界。

**Alternatives considered**：

- 只把 `spaceId` 传给 Qdrant：无法证明用户有权访问该空间。
- 在 `packages/rag` 内部查询权限：会让共享包耦合数据库和业务身份。

### Decision 2.1: `space_members` is the sole permission truth

**Choice**：新增 `space_members(space_id, user_id, role)`；`owner` 是 membership role，不在 `spaces` 存储平行 owner 字段。API 以当前用户的 membership join documents 生成 `RagAuthorizedDocument[]`，再执行可选 `spaceId` 缩小。既有空间通过明确迁移回填 owner membership；创建空间与 membership 写入在同一事务内完成。

**Rationale**：RAG 必须能对“存在但不可见”的空间作出确定 403，单纯已登录或 Qdrant payload 无法提供这种权限真相。唯一关系表可由 HTTP、MCP、协同和后续能力共同消费，避免 owner 字段和成员表发生漂移。

**Alternatives considered**：

- `spaces.created_by_user_id` 作为 owner：无法表达成员访问，仍需要第二套授权来源。
- RAG 单独维护 allowed document 表：会复制空间权限并在成员变更后滞后。

### Decision 3: Filter retrieval by each document's active indexed version

**Choice**：API 或 RAG application service 先取得授权文档及其 `latestIndexedVersion`，检索请求携带按文档计算出的 active version filter。没有有效 `latestIndexedVersion` 的文档不参与检索。

**Rationale**：Qdrant 中允许保留历史 points，但搜索只能消费当前已发布到检索副本的版本，避免旧快照污染搜索和 Citation。

**Alternatives considered**：

- 每次索引成功后删除旧 points：清理简单，但会损失历史版本和重建索引的灵活性。
- 只按最大 snapshotVersion 检索：无法处理不同文档的 active version 不同。

### Decision 4: Keep RAG transport on HTTP streaming, not Socket.IO

**Choice**：搜索使用普通 HTTP JSON；chat 使用 HTTP POST 流式响应，复用 M5 的 AI SDK/AdonisJS stream adapter。`RagStreamEvent` 只定义业务事件语义，由 adapter 转换为具体 transport encoding。M6 不引入 Socket.IO。

**Rationale**：M6 是单轮请求-响应生成，HTTP streaming 已满足增量文本、Citation、错误和 AbortController 取消。Socket.IO 会增加连接生命周期、鉴权、重连和 room 管理，却不提供当前范围所需的业务价值。

**Alternatives considered**：

- Socket.IO：适合服务端主动推送和长期双向会话，但超出 M6 范围。
- 单独自定义 SSE 协议：可行，但会重复 M5 的 stream adapter 和前端消费基础。

### Decision 5: Use single-turn chat and local page state

**Choice**：M6 的 chat 只处理当前请求的一条用户消息和一条回答。前端可以在当前页面显示本次 exchange，但不建立持久化 conversation 模型。

**Rationale**：先验证权限、检索、上下文和 Citation 的正确性，避免把会话存储、历史消息、标题生成和多轮上下文引入主链路。

**Alternatives considered**：

- 直接设计持久化 conversation：未来扩展更方便，但会引入数据库模型、权限、删除和历史检索范围。
- 只做搜索不做 chat：风险更低，但无法验证 `packages/rag -> packages/ai -> stream` 的完整链路。

### Decision 6: Best-effort navigation to the current editor

**Choice**：Citation 点击后导航到当前文档编辑页，并携带 `snapshotVersion`、`blockId` 等定位参数。编辑页尝试定位 block；无法精确定位时仍打开文档并展示非致命提示。M6 不建立独立只读 snapshot viewer。

**Rationale**：当前已有文档编辑页和协同编辑器，复用它可以控制 M6 范围。独立快照视图会引入版本读取、只读渲染、路由和权限的新链路。

**Alternatives considered**：

- 独立只读快照视图：定位更准确，但不属于 M6 搜索问答最小闭环。
- 只跳到文档页不携带 block 信息：实现简单，但无法满足 Citation 可追踪性。

### Decision 7: Separate contracts from transport adapters

**Choice**：`packages/contracts` 定义请求、检索结果、Citation 和业务流事件；`packages/adapters` 或 API adapter 负责 Qdrant/AI SDK/HTTP 的格式转换；`packages/rag` 不依赖 HttpContext、session 或前端组件。

**Rationale**：M5 已暴露 provider 和 transport 差异会影响多个边界。保持业务 contract 稳定，可以让 Qdrant、AI SDK 或 HTTP stream adapter 后续替换而不牵动页面和业务语义。

**Alternatives considered**：

- controller 直接拼接 Qdrant 和 provider 数据：初期代码少，但会重复 M4/M5 已经出现的边界漂移。

### Decision 8: Reuse the shared API envelope and error handler

**Choice**：RAG 成功响应使用 `ApiSuccessResponse<T>`；HTTP 错误使用 `ApiErrorResponse`，由 `apps/api/app/exceptions/handler.ts` 统一生成。HTTP 状态码映射由 controller/application 边界负责，错误展示文案由 shared error message 和 Web API 层收口。流已经开始后，业务级生成/检索错误使用 `RagStreamError` event，不再尝试发送 HTTP error envelope。

**Rationale**：项目已有统一 envelope、稳定错误码和异常 handler。M6 如果自定义 RAG response shape，会让 API、Tuyau、Web API wrapper 和页面再次出现分叉。

**Alternatives considered**：

- 让 RAG 自己定义 `{ error, data }`：会破坏统一 API envelope。
- 直接把 Qdrant/provider 原始错误返回给 Web：泄漏第三方 shape，并使页面耦合基础设施。

### Decision 9: Use domain subpaths, API wrapper, and feature view-models

**Choice**：RAG 类型从 `@docweave/contracts/rag` 和 `@docweave/contracts/api` 导入；`apps/web/src/lib/api.ts` 负责 Tuyau/fetch、envelope 解包和稳定错误转换；`apps/web/src/features/rag/lib/rag-view-model.ts` 负责页面消费结构。adapter 只做 shape 转换，不做权限或 HTTP 状态判断。

**Rationale**：这是项目当前数据契约规范已经落地的边界，能避免页面直接绑定 Tuyau 的偶然返回 shape 和 AI SDK stream 格式。

**Alternatives considered**：

- 页面直接调用 Tuyau：调用方便，但会把 transport typing 当成业务 contract。
- `packages/adapters` 负责状态码和权限：会让 adapter 变成第二个 service/controller。

## Risks And Trade-Offs

### Index migration cost

M4 旧 points 缺少 block metadata。M6 需要明确历史 snapshot 的重新索引策略，期间可能出现旧数据不可 Citation 的过渡状态。实现时应优先保证不把旧 payload 当作完整 Citation 结果返回。

### Permission query size

把 `allowedDocumentIds` 直接传给 Qdrant 在文档数量增长后可能产生过滤条件规模问题。M6 先采用清晰、可测试的 permission-first 边界；规模化后再评估 workspace/space payload filter、权限缓存或索引分区，但不得绕过 API 权限真相。

### Version filter complexity

不同文档可能有不同的 `latestIndexedVersion`，不能只使用一个全局 snapshot filter。需要在 retrieval application service 中把文档授权范围与 active version 组合成可执行的 Qdrant filter，并用集成测试覆盖多文档版本差异。

### Best-effort navigation is not exact snapshot replay

M6 的编辑页回跳不等价于历史 snapshot 精确恢复。Citation 必须展示其来源版本；如果当前编辑器无法恢复该版本，应明确提示并保持页面可用。精确历史查看属于后续版本能力。

### Streaming protocol compatibility

RAG 业务事件不能直接假设等同于 provider 原始事件。M6 需要通过 adapter 做事件映射，并验证 content type、事件顺序、abort 和错误结束语义，避免前端绑定 AI SDK 或 provider 的内部细节。

### Contract and envelope drift

RAG 需要同时维护领域 contract、共享 API envelope、stream event 和页面 view-model。所有新增字段必须先进入对应领域 contract，HTTP envelope 继续复用 `@docweave/contracts/api`，错误码必须能被统一异常 handler 和 Web API 层识别。

### UI scope pressure

搜索页和聊天页容易演变为完整聊天产品。M6 只保留搜索、单轮问答、Citation、取消和基础错误态，历史会话、复杂筛选、rerank 展示和完整聊天壳留到后续阶段。
