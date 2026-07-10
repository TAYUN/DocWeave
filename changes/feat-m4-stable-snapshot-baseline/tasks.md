# 实现任务

## 文件结构

- `Modify: packages/contracts/src/document.ts` — 扩展快照、索引任务、状态查询的共享 contract
- `Modify: packages/contracts/src/index.ts` — 暴露新增文档处理 contract
- `Create: packages/document/package.json` — 建立服务端文档处理共享包依赖入口
- `Create: packages/document/tsconfig.json` — 建立 `packages/document` TypeScript 基线
- `Create: packages/document/src/index.ts` — 导出快照内容处理能力
- `Create: packages/document/src/snapshot_content.ts` — 统一 BlockNote JSON 快照解析、校验与服务端预处理入口
- `Create: packages/rag/package.json` — 建立最小 RAG 处理共享包依赖入口
- `Create: packages/rag/tsconfig.json` — 建立 `packages/rag` TypeScript 基线
- `Create: packages/rag/src/index.ts` — 导出索引流水线输入输出类型
- `Create: packages/rag/src/index_document_snapshot.ts` — 封装 chunk、embedding 分批、upsert 的最小异步边界
- `Create: apps/worker/package.json` — 建立 worker 运行时依赖与脚本
- `Create: apps/worker/tsconfig.json` — 建立 worker TypeScript 基线
- `Create: apps/worker/src/index.ts` — 启动数据库轮询 worker
- `Create: apps/worker/src/config.ts` — 读取 worker 轮询、百炼 embedding 与 Qdrant 配置
- `Create: apps/worker/src/run_document_index_jobs.ts` — claim job、调用共享包并回写状态
- `Create: apps/api/database/migrations/20260709090000_add_snapshot_and_index_fields_to_documents_table.ts` — 为 `documents` 增加 `latest_snapshot_version` / `latest_indexed_version`
- `Create: apps/api/database/migrations/20260709091000_create_document_snapshots_table.ts` — 创建稳定快照表与唯一键
- `Create: apps/api/database/migrations/20260709092000_create_rag_index_jobs_table.ts` — 创建索引任务表与查询索引
- `Modify: apps/api/app/models/document.ts` — 暴露最新快照 / 最新已索引版本字段
- `Create: apps/api/app/models/document_snapshot.ts` — 映射 `document_snapshots` 表
- `Create: apps/api/app/models/rag_index_job.ts` — 映射 `rag_index_jobs` 表
- `Create: apps/api/app/services/document_processing_service.ts` — 收口快照创建、任务入队与状态查询事务
- `Modify: apps/api/app/controllers/documents_controller.ts` — 增加快照创建、索引触发、状态查询动作
- `Modify: apps/api/start/routes.ts` — 暴露 `/snapshots`、`/index`、`/status` 路由
- `Modify: apps/api/app/services/docweave_catalog_service.ts` — 在读取文档详情时携带版本状态字段
- `Create: apps/api/tests/functional/document_snapshot_flow.spec.ts` — 覆盖快照版本递增与状态回写
- `Create: apps/api/tests/functional/document_index_job_flow.spec.ts` — 覆盖索引任务创建、过期保护与状态查询
- `Create: packages/rag/src/index_document_snapshot.test.ts` — 以最小可运行检查覆盖 publish gate 与 superseded 规则

## Interfaces

### Shared Contracts

- **Produces**: `DocumentSnapshotDto`
  - `{ documentId: string; version: number; content: string; contentFormat: 'blocknote_json'; sourceDocumentUpdatedAt: string | null; createdAt: string }`
- **Produces**: `DocumentIndexJobStatus`
  - `'pending' | 'running' | 'succeeded' | 'failed' | 'superseded' | 'canceled'`
- **Produces**: `DocumentIndexJobStage`
  - `'queued' | 'preprocessing' | 'chunking' | 'embedding' | 'upserting' | 'publishing'`
- **Produces**: `DocumentIndexJobDto`
  - `{ id: string; documentId: string; targetSnapshotVersion: number; status: DocumentIndexJobStatus; stage: DocumentIndexJobStage; requestedByUserId: number | null; attemptCount: number; errorCode: string | null; errorMessage: string | null; createdAt: string; startedAt: string | null; finishedAt: string | null }`
- **Produces**: `DocumentProcessingStatusDto`
  - `{ documentId: string; latestSnapshotVersion: number | null; latestIndexedVersion: number | null; latestSnapshot: Pick<DocumentSnapshotDto, 'documentId' | 'version' | 'contentFormat' | 'createdAt'> | null; latestIndexJob: DocumentIndexJobDto | null }`

### API → Web

- **Consumes**: `POST /api/documents/:documentId/snapshots`
  - 输入：`{}`
  - 输出：`{ data: { snapshot: DocumentSnapshotDto; latestSnapshotVersion: number } }`
- **Consumes**: `POST /api/documents/:documentId/index`
  - 输入：`{ snapshotVersion?: number }`
  - 输出：`{ data: { job: DocumentIndexJobDto; latestSnapshotVersion: number | null; latestIndexedVersion: number | null } }`
- **Consumes**: `GET /api/documents/:documentId/status`
  - 输出：`{ data: DocumentProcessingStatusDto }`

### API → Worker

- **Produces**: `claimNextDocumentIndexJob(): Promise<{ jobId: string; documentId: string; targetSnapshotVersion: number } | null>`
  - 行为：可 claim `pending` job，或 lease 已过期的 `running` job
- **Produces**: `markDocumentIndexJobRunning(jobId: string): Promise<void>`
- **Produces**: `markDocumentIndexJobSucceeded(jobId: string, targetSnapshotVersion: number): Promise<void>`
- **Produces**: `markDocumentIndexJobFailed(jobId: string, errorCode: string, errorMessage?: string): Promise<void>`
- **Produces**: `markDocumentIndexJobSuperseded(jobId: string): Promise<void>`

### Worker → Shared Packages

- **Consumes**: `readSnapshotContent(snapshot: { content: string; contentFormat: 'blocknote_json' }): Promise<{ plainText: string; blocks: unknown[] }>`
- **Consumes**: `indexDocumentSnapshot(input: { documentId: string; snapshotVersion: number; plainText: string; blocks: unknown[] }): Promise<void>`
  - 行为：内部负责最多 10 条一批的 embedding 调用，并在 upsert 前校验向量维度与 collection 配置一致

## 1. Batch 1: 合同与持久化骨架

- **Depends on**: Batch 0
- **Files**: `packages/contracts/src/document.ts`, `packages/contracts/src/index.ts`, `apps/api/database/migrations/20260709090000_add_snapshot_and_index_fields_to_documents_table.ts`, `apps/api/database/migrations/20260709091000_create_document_snapshots_table.ts`, `apps/api/database/migrations/20260709092000_create_rag_index_jobs_table.ts`, `apps/api/app/models/document.ts`, `apps/api/app/models/document_snapshot.ts`, `apps/api/app/models/rag_index_job.ts`
- **Interfaces**:
  - Consumes：现有 `DocumentDetailDto`、`documents.content` 字符串正文事实
  - Produces：快照 / 索引任务 DTO、数据库表结构、Lucid 模型
- [x] **1.1 编写失败检查**
  - 先写最小类型断言或迁移检查，证明当前 contract 与数据库尚不存在快照和索引任务字段。
- [x] **1.2 运行检查并确认失败**
  - Run:
    - `pnpm typecheck:api`
  - Expected: 新增 DTO、模型或字段引用尚未满足。
- [x] **1.3 实现最小化代码**
  - 扩展 `packages/contracts/src/document.ts`
  - 新增三条 migration
  - 为 `Document`、`DocumentSnapshot`、`RagIndexJob` 建立最小 Lucid 模型
- [x] **1.4 运行检查并确认通过**
  - Run:
    - `pnpm typecheck:api`
  - Expected: PASS
- [x] **1.5 轻量复核**
  - 确认 `(document_id, version)` 已唯一
  - 确认 `latest_snapshot_version` / `latest_indexed_version` 可为空且互不混淆
  - 确认 job `status` 与 `stage` 枚举已落入共享 contract

## 2. Batch 2: API 快照、索引触发与状态 contract

- **Depends on**: Batch 1
- **Files**: `apps/api/app/services/document_processing_service.ts`, `apps/api/app/controllers/documents_controller.ts`, `apps/api/start/routes.ts`, `apps/api/app/services/docweave_catalog_service.ts`, `apps/api/tests/functional/document_snapshot_flow.spec.ts`, `apps/api/tests/functional/document_index_job_flow.spec.ts`
- **Interfaces**:
  - Consumes：`DocumentSnapshotDto`、`DocumentIndexJobDto`、现有认证边界
  - Produces：`POST /snapshots`、`POST /index`、`GET /status` 三类 API
- [x] **2.1 编写失败检查**
  - 先写功能测试，断言当前 API 还没有快照创建、索引触发和状态查询行为。
- [x] **2.2 运行检查并确认失败**
  - Run:
    - `pnpm --dir apps/api test --files tests/functional/document_snapshot_flow.spec.ts`
    - `pnpm --dir apps/api test --files tests/functional/document_index_job_flow.spec.ts`
  - Expected: FAIL
- [x] **2.3 实现最小化代码**
  - 在 `document_processing_service.ts` 中事务化创建快照、创建 job、查询状态
  - 在 `DocumentsController` 与 `routes.ts` 中暴露三个新动作
  - 保持 `PATCH /documents/:id` 不隐式生成快照
- [x] **2.4 运行检查并确认通过**
  - Run:
    - `pnpm --dir apps/api test --files tests/functional/document_snapshot_flow.spec.ts`
    - `pnpm --dir apps/api test --files tests/functional/document_index_job_flow.spec.ts`
    - `pnpm typecheck:api`
  - Expected: PASS
- [x] **2.5 收口检查**
  - 确认未变更的 `documents.content` 不会重复制造新快照版本
  - 确认 `latestSnapshotVersion` 只在快照成功时前移
  - 确认 `POST /index` 默认绑定当前 `latestSnapshotVersion`
  - 确认同一 `snapshotVersion` 的 active job 不会被重复创建
  - 确认 `GET /status` 不偷带 publish 语义

## 3. Batch 3: `packages/document` 与 `packages/rag` 最小执行边界

- **Depends on**: Batch 2
- **Files**: `packages/document/package.json`, `packages/document/tsconfig.json`, `packages/document/src/index.ts`, `packages/document/src/snapshot_content.ts`, `packages/rag/package.json`, `packages/rag/tsconfig.json`, `packages/rag/src/index.ts`, `packages/rag/src/index_document_snapshot.ts`, `packages/rag/src/index_document_snapshot.test.ts`
- **Interfaces**:
  - Consumes：snapshot `content`、`contentFormat`
  - Produces：worker 可调用的预处理与索引函数
- [x] **3.1 编写失败检查**
  - 先写一个最小测试，断言当前仓库没有可复用的 snapshot 预处理与 publish gate。
- [x] **3.2 运行检查并确认失败**
  - Run:
    - `node --import tsx --test packages/rag/src/index_document_snapshot.test.ts`
  - Expected: FAIL
- [x] **3.3 实现最小化代码**
  - 在 `packages/document` 中收口 BlockNote JSON 解析与纯文本提取
  - 在 `packages/rag` 中建立 `indexDocumentSnapshot(...)` 入口、最多 10 条一批的 embedding 调用与 superseded publish gate
  - 使用 `openai` SDK 对接百炼 OpenAI 兼容 endpoint，固定 `text-embedding-v4` + `EMBEDDING_DIMENSIONS=1536`
  - 若 `@blocknote/server-util` 在本阶段接入过重，则先保留兼容它的薄包装，不扩成导出体系
- [x] **3.4 运行检查并确认通过**
  - Run:
    - `node --import tsx --test packages/rag/src/index_document_snapshot.test.ts`
    - `pnpm typecheck:api`
  - Expected: PASS
- [x] **3.5 轻量复核**
  - 确认 `packages/document` 不耦合数据库
  - 确认 `packages/rag` 不直接依赖 HTTP 上下文
  - 确认 `packages/rag` 对超过 10 条的 chunk 自动分批
  - 确认 collection 维度不匹配时直接失败，不做脏写入
  - 确认 publish gate 允许把旧 job 记成 `superseded`

## 4. Batch 4: worker 数据库轮询与最终联通验证

- **Depends on**: Batch 3
- **Files**: `apps/worker/package.json`, `apps/worker/tsconfig.json`, `apps/worker/src/index.ts`, `apps/worker/src/config.ts`, `apps/worker/src/run_document_index_jobs.ts`
- **Interfaces**:
  - Consumes：`claimNextDocumentIndexJob`、`readSnapshotContent`、`indexDocumentSnapshot`
  - Produces：最小数据库轮询 worker 与 `latestIndexedVersion` 发布行为
- [x] **4.1 编写失败检查**
  - 先用类型检查或最小启动检查证明 worker 当前不存在可执行入口。
- [x] **4.2 运行检查并确认失败**
  - Run:
    - `pnpm --dir apps/worker exec tsc --noEmit`
  - Expected: FAIL
- [x] **4.3 实现最小化代码**
  - 建立 worker 配置与轮询循环
  - claim `pending` job 或 lease 超时的 `running` job，并切到 `running`
  - 调用共享包后回写 `succeeded` / `failed` / `superseded`
  - 在 `config.ts` 中显式读取 `QDRANT_*`、`DASHSCOPE_*`、`EMBEDDING_*` 与 worker lease/polling 配置
- [x] **4.4 运行检查并确认通过**
  - Run:
    - `pnpm --dir apps/worker exec tsc --noEmit`
    - `pnpm typecheck:api`
  - Expected: PASS
- [x] **4.5 收口确认**
  - 确认 worker 仍是数据库轮询，而不是提前换成队列
  - 确认卡死的 `running` job 可以按 lease 规则重新被领取
  - 确认失败不会回退 `latestIndexedVersion`
  - 确认协同持久化仍未被混入本 change
