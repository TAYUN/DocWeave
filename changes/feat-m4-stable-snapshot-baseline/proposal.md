# 变更提案

## Why

`feat-m3-collaboration-baseline` 已经让 DocWeave 具备了最小协同闭环：两个浏览器可以进入同一文档房间、同步正文并展示基础在线状态。

但当前 M4 主线真正缺的不是“再把协同持久化做深一点”，而是先把“稳定快照真相 + 索引任务基线”钉死。当前缺口主要有：

1. 当前只有 `documents.content` 这一份正文字段，没有版本化的 `document_snapshots` 真相表。
2. 当前没有 `rag_index_jobs`，也没有 `latestSnapshotVersion` / `latestIndexedVersion` 的稳定语义。
3. 后续索引、RAG、Citation 与导出都需要一个可追踪版本的服务端快照输入，不能继续直接挂在运行中的 Yjs 内存态上。
4. `apps/worker` 与 `packages/rag` 还基本是空壳，若不先把边界和 API contract 定清，后续实现会非常容易发散。

按照当前路线图，M3 之后的下一步本来就应该是“稳定快照与索引基线”。因此现在需要新增一条 change，先把“协同正文如何进入稳定快照、协同房间如何从稳定真相恢复”收口成一个明确的 M4 基线，再把索引任务接在这个真相之后。

## What Changes

- 定义 `document_snapshots`、`rag_index_jobs` 与 `documents.latestSnapshotVersion` / `latestIndexedVersion` 的最小实现语义。
- 明确“保存快照”“触发索引”“发布内容”三者的职责拆分，并把“发布内容”继续留在后续阶段。
- 为 `apps/api`、`apps/worker`、`packages/document`、`packages/rag` 建立最小清晰边界。
- 为后续 `snapshot -> preprocess -> chunk -> embedding -> qdrant` 链路预留可信输入和任务模型，但不在本 change 中扩成完整 RAG / AI / 导出方案。
- 明确主线 M4 与 `feat-m4-collaboration-persistence-baseline` 的边界：本 change 先定义稳定真相和索引任务，不在此直接实现 `apps/collab` 的 `onLoadDocument` / `onStoreDocument` 持久化。

## Capabilities

### 新增能力

- document-stable-snapshot-baseline
- rag-index-job-baseline
- document-snapshot-index-status-baseline

### 修改能力

- api-metadata-route-baseline

## Scope

### In Scope

- `document_snapshots` 的字段、唯一键、正文格式与版本规则
- `rag_index_jobs` 的字段、状态、版本绑定与过期任务处理
- `documents.latestSnapshotVersion` / `latestIndexedVersion` 的更新语义
- 快照生成、索引触发、状态查询的 API contract
- `apps/api`、`apps/worker`、`packages/document`、`packages/rag` 的边界
- “保存快照”“触发索引”“发布内容”三者的职责拆分
- 以当前 `documents.content` 为快照输入真相，建立服务端稳定快照基线

### Out of Scope

- 不在本 change 中实现 `apps/collab` 的 `onLoadDocument` / `onStoreDocument` 真实持久化
- 不在本 change 中定义自动保存、节流持久化、重启恢复或 Yjs 增量日志方案
- 不在本 change 中落地完整 `snapshot -> chunk -> embedding -> qdrant`
- 不在本 change 接入编辑器 AI、RAG 问答或导出任务
- 不做多节点协同扩展、Redis pub/sub 或复杂离线回放
- 不把当前 M4 一次性扩成“协同持久化 + 索引 + 导出 + AI”的大杂烩

## Impact

- 影响的代码区域：`apps/api`、`apps/worker`、`packages/contracts`、新增 `packages/document`、`packages/rag`
- 影响的 API 或接口：文档快照创建、索引任务触发、快照 / 索引状态查询、Worker 任务领取与发布边界
- 影响的用户路径：文档“保存快照 / 更新知识库”的可解释状态，以及后续搜索与引用能力的输入可信度
