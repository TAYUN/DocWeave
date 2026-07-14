# M6 RAG 搜索与问答执行任务

本清单是 `execution-contract.md` 的可执行任务映射。M6 仅实现稳定快照上的权限范围检索、单轮 HTTP 流式问答和 Citation 回跳；不引入 Socket.IO、BullMQ、持久化会话或文件 RAG。

## File Structure

- `Modify: packages/contracts/src/rag.ts` - 定义检索范围、请求和流业务事件。
- `Modify: packages/rag/src/index.ts` - 导出索引和检索领域入口。
- `Modify: packages/rag/src/index_document_snapshot.ts` - 构造带块级元数据的稳定索引点。
- `Create: packages/rag/src/retrieve_document_chunks.ts` - 将授权范围转换为检索后端请求并过滤 active version。
- `Modify: apps/worker/src/run_document_index_jobs.ts` - 写入完整索引 payload 并隔离旧索引点。
- `Modify: apps/api/app/services/rag_service.ts` - 编排授权范围、检索和单轮问答。
- `Create: apps/api/database/migrations/*_create_space_members_table.ts` - 建立唯一的空间成员权限关系并回填现有空间 owner。
- `Create: apps/api/app/models/space_member.ts` - 表达 space/user/role 的权限真相。
- `Modify: apps/api/app/services/docweave_catalog_service.ts` - 在创建空间事务中建立 owner membership。
- `Modify: apps/api/app/mcp/tools/search_knowledge_tool.ts` - 使用经过认证的 member scope，或在未建立 MCP 身份映射前拒绝检索。
- `Modify: apps/api/app/controllers/rag_controller.ts` - 提供受保护的 search/chat HTTP 边界。
- `Modify: apps/api/app/validators/runtime.ts` - 校验 RAG 的 `spaceId`、limit 与 topK。
- `Modify: apps/api/start/routes.ts` - 将 RAG 路由置于认证 middleware 内。
- `Modify: apps/api/app/exceptions/error_messages.ts` - 注册稳定 RAG 错误码与错误文案。
- `Modify: apps/web/src/lib/api.ts` - 解包 RAG JSON envelope 并消费 stream。
- `Create: apps/web/src/features/rag/lib/rag-view-model.ts` - 将领域结果转换为页面 view-model。
- `Create: apps/web/src/features/rag/*` - 实现搜索、聊天和 Citation 组件。
- `Modify: apps/web/src/routes/*` - 注册 `/search`、`/chat` 与 Citation 编辑器定位参数。

## Interfaces

### Batch 1 produces

- `RagIndexBlock`：完整 `workspaceId`、`spaceId`、`documentId`、`snapshotVersion`、`blockId`、`chunkId`、`headingPath`、`plainText` payload。
- 稳定 point ID：由 document、snapshot、block 和 chunk 唯一确定。

### Batch 2 consumes and produces

- 输入：`RagRetrievalScope`，其中每个 `RagAuthorizedDocument` 带 `latestIndexedVersion`。
- 输出：只含授权且 active-version 命中的 `RagSearchResponse`，HTTP 成功采用 `ApiSuccessResponse`。

### Batch 3 consumes and produces

- 输入：Batch 2 的授权检索结果与 `RagChatRequest`。
- 输出：`start -> retrieval -> text-delta/citation -> finish` 或 `error` 的 `RagStreamEvent`。

### Batch 4 consumes and produces

- 输入：稳定 API envelope 与 `RagStreamEvent`。
- 输出：搜索/聊天 view-model、AbortController 取消状态，以及带 `snapshotVersion`/`blockId` 的编辑器回跳。

## Batch 1: 契约与块级索引管线 [完成]

**Depends on:** None

- [x] 1.1 为 block/chunk payload 和稳定 point ID 编写失败测试。
- [x] 1.2 在 `packages/contracts/src/rag.ts` 增加 `RagIndexBlock`。
- [x] 1.3 在 `packages/rag/src/index_document_snapshot.ts` 实现 block-aware preprocessing。
- [x] 1.4 在 worker 将完整 payload 写入 Qdrant，并验证旧 payload 不生成完整 Citation。
- [x] 1.5 运行 `packages/rag` 与 worker 定向测试并审查索引边界。

## Batch 2: 权限优先检索与 HTTP search

**Depends on:** Batch 1

- [x] 2.1 先为双用户既有空间越权、owner membership 写入和旧空间回填写失败功能测试。
- [x] 2.2 建立 `space_members` migration/model，并让创建空间在同一事务写入 `owner` membership；回填既有空间的 owner membership。
- [x] 2.3 在 `packages/contracts/src/rag.ts` 维护 `RagAuthorizedDocument`/`RagRetrievalScope`；在 `packages/rag` 以 scope 过滤 active-version hits。
- [x] 2.4 实现 API member scope resolver；未授权 `spaceId` 必须在 embedding/Qdrant/model 前返回 403。
- [x] 2.5 将 MCP `search_knowledge` 接入同一认证身份与 scope resolver，未建立身份映射时明确拒绝，不得调用真实 RAG。
- [x] 2.6 对齐 API/worker 的 embedding model 与 dimensions 配置，并将 RAG 错误码集中到 shared `apiErrors`。
- [x] 2.7 运行 API/RAG 定向测试；审查匿名 401、双用户既有空间 403、MCP 无旁路、空索引、失败 envelope 和多文档 active version。

## Batch 3: 单轮 chat HTTP streaming

**Depends on:** Batch 2

- [x] 3.1 为 `RagStreamEvent` 顺序、检索/模型错误和取消分别写失败测试。
- [x] 3.2 实现单轮 chat application service，复用 M5 AI runtime 和 Batch 2 授权检索结果。
- [x] 3.3 在 `RagController` 添加 HTTP stream transport adapter，保证流开始前走共享 HTTP error envelope。
- [x] 3.4 接入 AbortSignal，确保取消不发送成功 `finish` 且释放模型转发资源。
- [x] 3.5 运行 stream 定向测试；审查事件序列、错误可重试性和无 Socket.IO 越界。

## Batch 4: Citation 回跳与搜索/聊天页面

**Depends on:** Batch 2 and Batch 3

- [x] 4.1 为 `apps/web/src/lib/api.ts` 的 envelope 解包、错误码保留和 stream 解析编写失败测试。
- [x] 4.2 实现 RAG API wrapper 与 feature view-model，禁止页面消费 Tuyau/provider 原始 shape。
- [x] 4.3 实现 `/search` 与 `/chat` 页面，覆盖 loading、empty、restricted、no-index、failed、streaming、cancelled 和 error。
- [x] 4.4 将 Citation 导航到当前编辑器，传递 `snapshotVersion`/`blockId` 并实现非致命定位失败状态。
- [x] 4.5 运行 Web 定向测试与构建；审查单轮本地 exchange 不暗示持久化历史。

## Batch 5: 端到端验证与审查

**Depends on:** Batch 1, Batch 2, Batch 3, Batch 4

- [x] 5.1 汇总 contracts、RAG、worker、API 与 Web 的定向测试证据。
- [x] 5.2 执行工作区类型检查、相关 lint/build 和关键功能测试。
- [x] 5.3 运行独立代码审查，处理所有 Critical/Important 问题。
- [x] 5.4 同步 change 任务状态、重建 state、执行 closing SOP 与 delta spec 合并检查。
- [x] 5.5 在全部 M6 改动、验证和审查完成后，才创建一笔符合约定的中文 Git 提交。

## Batch 6: 文档页索引操作闭环 [完成]

**Depends on:** Batch 4

- [x] 6.1 在前端 API 适配层暴露稳定快照与索引任务命令，保留统一错误契约。
- [x] 6.2 在文档编辑页提供“保存并创建快照”和“更新知识库”入口，并展示当前索引状态。
- [x] 6.3 为操作入口运行 Web 类型检查、lint、定向测试与生产构建，并在本地页面验证快照/索引任务提交状态；以 `space_members` 拒绝非成员索引任务，索引活跃时轮询页面状态。

## Batch 7: 问答 Citation 可读性 [完成]

**Depends on:** Batch 4

- [x] 7.1 将回答正文中已知的内部 Citation ID 映射为可点击的短序号，未知方括号文本保持原样。
- [x] 7.2 将来源改为默认收起的参考来源区，展开后提供编号、摘录和原文跳转，避免来源卡片打断阅读。
- [x] 7.3 为 Citation 文本分段增加定向测试，并运行 Web 测试、lint、类型检查和生产构建。
