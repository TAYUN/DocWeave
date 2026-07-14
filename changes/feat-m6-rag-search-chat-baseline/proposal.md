# M6 RAG 搜索与问答最小闭环

## Why

M4 已经建立稳定快照、索引任务、embedding 和 Qdrant 写入基线，M5 已经完成编辑器 AI 的流式模型能力和 API 适配。但当前 RAG 搜索与问答仍停留在占位实现：索引点缺少 Citation 所需的块级元数据，RAG 路由未接入认证，Qdrant 检索和流式聊天尚未实现，搜索页与聊天页也还不能形成真实用户闭环。

如果直接进入代码实现，后续很可能再次修改索引点 schema、权限输入、流式协议和前端 view-model。因此本 change 先完成一轮小型 planning，形成契约层、适配层和 UI 边界，再进入 build。

## What Changes

- 重制定 RAG 索引点和块级预处理 contract，统一承载 workspace、space、document、snapshot、block、chunk、heading 和纯文本元数据。
- 明确 `apps/api` 先计算用户可见文档范围，再由 `packages/rag` 按可见范围和可选 `spaceId` 检索。
- 新增以 `space_members` 为唯一权限真相的最小成员关系；空间 owner 作为 membership role 存储，HTTP 与 MCP 使用同一 scope resolver。
- 强制保护 `/api/rag/search` 与 `/api/rag/chat`，定义未认证、无权限、无索引和检索失败语义。
- 定义单轮 RAG chat streaming contract，包括 content type、事件顺序、取消、错误和前端消费方式。
- 明确 RAG 不引入 `socket.io`：搜索使用 HTTP JSON，问答使用 HTTP POST 流式响应，复用 M5 的 AI SDK/AdonisJS stream adapter。
- 遵循 `docs/architecture/05. 数据契约与适配层设计.md`：跨边界先过领域 contract，HTTP 使用 `ApiSuccessResponse`/`ApiErrorResponse`，第三方和 transport shape 进入 adapter，Web 页面只消费 `apps/web/src/lib/api.ts` 输出的 view-model 输入。
- 确定 Citation 采用回到当前文档编辑页的 best-effort 定位，不在 M6 引入独立只读快照视图。
- 补齐搜索页和聊天页的 view-model、组件树、状态和 Citation 交互规格。

## Capabilities

### Added

- rag-index-point-metadata-contract
- rag-permission-scoped-retrieval
- rag-search-and-single-turn-chat-stream
- rag-citation-editor-navigation

### Modified

- document-snapshot-preprocessing-boundary
- rag-search-and-citation-contract
- search-and-chat-page-specification

## Scope

### In Scope

- 稳定快照到块级索引点的预处理与 schema 设计。
- `space_members` 的迁移、既有空间 owner 回填与创建空间的 owner membership 写入。
- M4 索引数据的 schema 升级和重新索引策略设计。
- 全部当前用户可见文档的默认检索。
- MCP RAG 检索必须在已认证的成员 scope 内运行，不能形成匿名或全局文档旁路。
- 可选 `spaceId` 过滤，且永远发生在权限裁剪之后。
- 单轮搜索和问答。
- RAG 流式事件、错误和取消契约。
- 当前文档编辑页的 Citation best-effort 定位策略。
- `/search` 和 `/chat` 的页面交互规格。

### Out of Scope

- 导入、导出、OCR、PDF、Office 和文件 RAG。
- 文档发布、分享链接和公开访问。
- 持久化多轮 conversation。
- 复杂 rerank、知识图谱和 Agent 工作流。
- BullMQ 和复杂后台任务治理。
- M6 代码实现本身；本 change 先产出可审查 planning artifacts。

## Impact

- `packages/contracts`：新增索引点、检索范围、Citation 和流式事件边界。
- `packages/adapters` / `packages/document`：提供稳定的 block-aware 预处理和跨边界转换。
- `packages/rag`：消费权限裁剪后的范围，提供 Qdrant 检索接口和上下文组装边界。
- `apps/api`：保护 RAG 路由、计算可见文档范围并承载单轮流式问答。
- `apps/web`：新增搜索/聊天页面规格，并支持 Citation 回到当前文档编辑页。
- `apps/worker`：按新索引点 schema 写入 Qdrant，并明确历史索引重新生成策略。
