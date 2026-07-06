# 变更提案

## 背景（Why）

当前 DocWeave 的 RAG 搜索能力同时存在两处占位入口：

- HTTP：`apps/api/app/controllers/rag_controller.ts`
- MCP：`apps/api/app/mcp/tools/search_knowledge_tool.ts`

两处入口目前都直接返回各自的 scaffold 结果，没有共享服务层或共享包入口。这种结构在占位阶段可以工作，但一旦后续接入真实检索逻辑，就容易出现 HTTP 与 MCP 返回结构、过滤规则和行为演进不同步的问题。

## 变更内容（What Changes）

- 新增统一的 RAG 搜索共享入口，优先落在 `apps/api/app/services/rag_service.ts`
- 将 HTTP `RagController.search` 改为复用共享入口
- 将 MCP `search_knowledge` 改为复用共享入口
- 保持当前 scaffold 的返回结构和占位语义不变，不在本次 change 中接入真实向量检索

## 能力（Capabilities）

### 新增能力

- rag-search-shared-entry

### 修改能力

- rag-search-scaffold
- docweave-mcp-knowledge-search

## 范围（Scope）

### 范围内（In Scope）

- 抽取共享 RAG 搜索入口
- 对齐 HTTP 与 MCP 的输入与输出结构
- 保持当前占位结果不变

### 范围外（Out of Scope）

- 不接入 `packages/rag` 的真实检索实现
- 不实现向量数据库查询、rerank、metadata filter 或权限过滤
- 不改动 RAG chat 行为
- 不改动前端搜索 UI

## 影响（Impact）

- 影响的代码区域：`apps/api/app/controllers`、`apps/api/app/services`、`apps/api/app/mcp/tools`
- 影响的开发方式：后续无论是 HTTP 还是 MCP，都只应复用同一份 RAG 搜索入口
- 影响的后续演进：为未来将共享逻辑下沉到 `packages/rag` 提供稳定过渡层
