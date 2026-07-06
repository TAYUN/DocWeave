# 设计说明

## 目标

把当前分散在 HTTP controller 和 MCP tool 中的 RAG 搜索占位实现收敛到一个共享入口，降低后续接入真实检索能力时的重复修改成本。

## 方案

本次先在 `apps/api/app/services/rag_service.ts` 新增 `RagService`，提供一个明确的 `search` 方法：

- 输入：`query`
- 输出：与当前 HTTP `/api/rag/search` 一致的 `query + hits[]`

HTTP 与 MCP 的职责区分如下：

- `RagController.search`
  - 负责 HTTP 入参读取
  - 负责调用 `RagService.search`
  - 负责维持现有 API 响应包裹方式

- `search_knowledge_tool`
  - 负责 MCP 入参校验
  - 负责调用 `RagService.search`
  - 负责维持现有 MCP structured response 形态

## 为什么先落在 apps/api service

本次不直接落到 `packages/rag`，原因是当前真实检索能力还没有稳定接口。先在 `apps/api` 服务层收口，可以在不扩大范围的前提下完成共享入口抽取；等检索逻辑成形后，再把 `RagService` 改为调用 `packages/rag`，或者整体下沉。

## 边界

- 不新增新的字段契约
- 不改变当前命中数据内容
- 不让 controller 或 MCP tool 再各自维护一份搜索结果构造逻辑
