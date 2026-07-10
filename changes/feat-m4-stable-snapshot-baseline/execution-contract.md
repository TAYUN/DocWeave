# 执行合同

## Intent Lock

- **变更名称**：`feat-m4-stable-snapshot-baseline`
- **要解决的问题**：为 DocWeave 建立 M4 主线所需的稳定快照真相、索引任务基线和版本状态语义，让后续索引与检索只围绕稳定快照运行，而不是继续依赖协同内存态。
- **范围内**：
  - `document_snapshots`、`rag_index_jobs`、`documents.latestSnapshotVersion` / `latestIndexedVersion`
  - `POST /snapshots`、`POST /index`、`GET /status`
  - `apps/worker` 数据库轮询基线
  - `packages/document` 与 `packages/rag` 的最小执行边界
  - 百炼 `text-embedding-v4` + Qdrant 的最小 embedding / upsert 基线
- **范围外**：
  - `apps/collab` 的真实 `onLoadDocument` / `onStoreDocument` 持久化
  - 自动保存、节流持久化、Yjs 增量日志、重启恢复
  - 完整 RAG 问答、导出、AI、发布语义
  - BullMQ、多节点协同、复杂调度中心

## Approved Behavior

- **已批准需求摘要**：
  - 稳定快照必须持久化为服务端版本真相，字段至少覆盖 `documentId`、`version`、`content`、`contentFormat`、`sourceDocumentUpdatedAt`、`createdAt`
  - `snapshotVersion` 必须按文档单调递增，并在创建快照事务内原子更新 `documents.latestSnapshotVersion`
  - 显式创建快照对未变化正文必须幂等，不重复膨胀版本
  - 索引任务必须绑定明确 `targetSnapshotVersion`，并具备 `status` / `stage`
  - 同一 `(documentId, targetSnapshotVersion)` 最多一个 active job
  - 新版本 job 不能被旧版本 job 覆盖，旧 job 必须可标记为 `superseded`
  - `latestIndexedVersion` 只能在完整 pipeline 成功后更新
  - embedding 调用必须按 provider 限制分批，collection 维度不匹配必须失败
  - `GET /status` 只暴露 M4 快照/索引语义，不混入 publish
- **关键场景**：
  - 首次快照生成版本 `1`
  - 连续点击保存快照但正文未变时复用最新快照
  - 指定不存在的 `snapshotVersion` 创建 job 时失败
  - 新版本 job 排挤旧 `pending` job
  - 旧 `running` job 在新版本已发布后完成时标记 `superseded`
  - 超过 10 个 chunks 的 embedding 自动分批
  - Qdrant collection 维度与 `EMBEDDING_DIMENSIONS=1536` 不一致时直接失败
- **验收检查**：
  - 快照、索引任务、已索引版本三层语义一致
  - 失败不会回退 `latestIndexedVersion`
  - `apps/api` 不内联执行长耗时索引
  - `packages/rag` 不假装支持 OpenAI 兼容模式下没有的 `text_type`

## Design Constraints

- **架构约束**：
  - 主线 M4 先以 `documents.content` 作为快照输入真相
  - `apps/collab` 持久化仍留给 `feat-m4-collaboration-persistence-baseline`
  - `apps/api` 负责事务真相，`apps/worker` 负责异步执行，`packages/document` / `packages/rag` 负责纯处理边界
- **接口约束**：
  - 只落地 `POST /snapshots`、`POST /index`、`GET /status`
  - `POST /index` 默认绑定当前 `latestSnapshotVersion`
  - `GET /status` 顶层 job 摘要优先 active，再回落到最近的 `failed` / `succeeded`
- **依赖约束**：
  - `apps/worker` 保持 plain Node TS
  - worker 用 `pg` 直接做少量 SQL，不新增 `knex`
  - embedding 通过 `openai` SDK 访问百炼 OpenAI 兼容 endpoint
  - 模型固定 `text-embedding-v4`，维度固定 `1536`
- **数据约束**：
  - `document_snapshots` 业务唯一键 `(document_id, version)`
  - `rag_index_jobs` 需记录 `locked_at` 与 `attempt_count`
  - `QDRANT_COLLECTION` 维度必须与 `EMBEDDING_DIMENSIONS` 一致

## Task Batches

### Batch 1

- **目标**：建立快照 / 索引任务持久化骨架和共享 contract
- **输入**：现有 `documents` 表、`DocumentDetailDto`、Lucid migration 基线
- **输出**：
  - `documents` 新版本字段
  - `document_snapshots`、`rag_index_jobs`
  - 对应 contract 与模型
- **完成标准**：
  - typecheck 通过
  - 唯一键、状态枚举、可空版本字段都已落地

### Batch 2

- **目标**：落地快照创建、索引触发、状态查询三类 API
- **输入**：Batch 1 数据模型与 contract
- **输出**：
  - `document_processing_service.ts`
  - `POST /snapshots`
  - `POST /index`
  - `GET /status`
  - 功能测试
- **完成标准**：
  - 快照事务规则、幂等规则、同版本 active job 去重规则可验证
  - `PATCH /documents/:id` 仍不隐式生成快照

### Batch 3

- **目标**：建立 `packages/document` 和 `packages/rag` 的最小可执行边界
- **输入**：Batch 2 的 snapshot / job contract
- **输出**：
  - BlockNote JSON snapshot 解析入口
  - `indexDocumentSnapshot(...)`
  - 最多 10 条一批的 embedding 调用
  - 维度校验与 publish gate 测试
- **完成标准**：
  - `packages/rag` 能对 chunk 分批 embedding
  - collection 维度不匹配会失败而不是脏写

### Batch 4

- **目标**：建立 worker 轮询执行、job lease 和版本发布闭环
- **输入**：Batch 3 的共享处理能力
- **输出**：
  - `apps/worker` 运行时与配置
  - claim / reclaim / publish / fail 回写逻辑
- **完成标准**：
  - stale `running` job 可按 lease 重新领取
  - 成功时原子前移 `latestIndexedVersion`
  - 失败或 superseded 不破坏上一版检索真相

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 快照版本递增与幂等
  - 索引任务创建、去重、superseded、状态查询
  - publish gate 与维度校验
- **必需的边界情况**：
  - 同一文档首次快照
  - 正文未变重复保存
  - 不存在的 snapshotVersion
  - 超过 10 chunks 的 embedding 分批
  - stale `running` job reclaim
  - 维度不匹配
- **回归敏感区域**：
  - 现有文档详情读取
  - `documents.content` 保存链路
  - `apps/api` 类型和 migration 基线

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这次不是单文件 tweak，但边界已经收口，不需要再开新 planning
  - `apps/api`、`apps/worker`、`packages/document`、`packages/rag` 有明确分批依赖，适合按 batch 执行并每批验证

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 规划工件已覆盖主线 M4 所需行为，待执行验证 |
| Correctness | Pending | 需靠失败测试、typecheck、worker 入口检查确认 |
| Coherence | Pending | 当前边界与 `feat-m4-collaboration-persistence-baseline` 已分离，待实现时继续守边界 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 2 完成后审一次 API 语义与幂等规则
  - Batch 3 完成后审一次 provider batching / dimensions / adapter 边界
  - Batch 4 完成后审一次 publish gate 与 lease 语义
- **阻塞类别**：
  - 任何 requirement 未映射到 batch / test
  - 引入协同持久化范围
  - 引入完整 RAG chat / publish / export 范围
  - provider 兼容限制被假装支持

## Escalation Rules

- **何时回退到 `specifying`**：
  - 若新增了 `latestPublishedVersion`、collab 持久化真实协议、或完整检索问答范围
  - 若发现 specs 还缺关键行为描述
- **何时回退到 `bridging`**：
  - 若 `execution-contract.md` 与更新后的 design / tasks 不再一致
  - 若 embedding provider、维度或 worker 宿主形态发生变化
- **何时不得继续实现**：
  - 用户未批准本合同
  - `text_type` 等 DashScope 专有参数被要求在当前 OpenAI 兼容实现里强行支持
  - 发现 contract 中 requirement 无法映射到任何 batch 或验证义务
