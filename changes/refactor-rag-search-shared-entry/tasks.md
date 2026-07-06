# 实现任务

## 文件结构

- `Add: apps/api/app/services/rag_service.ts` — 新增共享 RAG 搜索入口，承载当前占位搜索结果构造逻辑。
- `Modify: apps/api/app/controllers/rag_controller.ts` — 改为复用 `RagService.search`。
- `Modify: apps/api/app/mcp/tools/search_knowledge_tool.ts` — 改为复用 `RagService.search`。

## 接口

### RAG Search Service

- **Consumes**: `query: string`
- **Produces**: `{ query: string; hits: Array<{ documentId: string; score: number; snippet: string }> }`

### HTTP Search Endpoint

- **Consumes**: `POST /api/rag/search` with `{ query?: string }`
- **Produces**: `{ data: { query: string; hits: [...] } }`

### MCP Search Tool

- **Consumes**: `search_knowledge(query: string)`
- **Produces**: structured response with `query` and `hits`

## 1. Batch 1: 收敛共享入口

Depends on: None

- [x] 新增 `RagService.search(query)`，将当前 scaffold 命中结果集中在 service 中维护
- [x] 修改 `RagController.search`，改为调用 `RagService.search`
- [x] 修改 `search_knowledge_tool`，改为调用 `RagService.search`
- [x] 运行 `pnpm --dir apps/api typecheck`
- [x] 运行 `pnpm --dir apps/api exec eslint "app/services/rag_service.ts" "app/controllers/rag_controller.ts" "app/mcp/tools/search_knowledge_tool.ts"`

## 验收记录

- HTTP 与 MCP 搜索结果结构保持一致
- 占位数据来源只剩一处
- 本次 change 不扩大到真实 RAG 检索实现
