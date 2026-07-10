# 设计说明

## Context

`feat-m4-stable-snapshot-baseline` 当前只有 `proposal.md`，仓库代码事实仍停留在 M3 之后的最小骨架：

1. `apps/api/app/models/document.ts` 只有 `content` 与 `status`，还没有 `latestSnapshotVersion` / `latestIndexedVersion`。
2. `apps/api/database` 中还没有 `document_snapshots` 与 `rag_index_jobs` 表。
3. `apps/collab/src/server.ts` 只有内存 `Y.Doc` 与空的 `onStoreDocument` hook，占位清晰，但没有真实恢复或持久化。
4. `apps/worker` 与 `packages/rag` 当前都只有 `.gitkeep`，说明 M4 主线不能假设现成后台执行框架已经存在。
5. `packages/adapters` 目前负责 `documents.content` 的 BlockNote JSON 序列化与兜底解析，这意味着“快照正文格式”和“未来 `packages/document` 的边界”必须先定清。

现有架构文档把方向讲清楚了：

1. 文档 17 明确区分协同运行态与稳定快照。
2. 文档 24 明确区分 `snapshotVersion` 与 `latestIndexedVersion`。
3. 文档 25 / 26 / 27 明确索引围绕稳定快照、发布语义另拆。

但它们还没有细到足以直接开工实现的程度，尤其缺少：

1. `document_snapshots` / `rag_index_jobs` 的具体字段与唯一键。
2. `latestSnapshotVersion` / `latestIndexedVersion` 的事务更新规则。
3. 旧索引任务如何过期、谁来判定 stale publish。
4. `POST /snapshots`、`POST /index`、`GET /status` 的精确 contract。
5. `apps/api`、`apps/worker`、`packages/document`、`packages/rag` 的最小接口。

## Goals

1. 为 M4 主线钉死一套最小但可直接编码的“稳定快照真相 + 索引任务基线”。
2. 让 `documents.content` 可以先作为快照输入真相，而不被迫等待协同持久化子题完成。
3. 为 `apps/worker` 与 `packages/rag` 建立最小执行边界，但不把本 change 扩成完整 RAG / AI / 导出实现。
4. 把“保存快照”“触发索引”“发布内容”明确拆开，避免本阶段提前引入 `latestPublishedVersion` 落地实现。
5. 明确主线 M4 与 `feat-m4-collaboration-persistence-baseline` 的边界，避免重复设计版本语义。

## Decisions

### Decision: `document_snapshots` Is The Stable Version Truth Table

**Choice**

M4 将新增 `document_snapshots` 表，并使用 `(document_id, version)` 作为唯一业务键；每条记录至少包含：

1. `id`
2. `document_id`
3. `version`
4. `content`
5. `content_format`
6. `source_document_updated_at`
7. `created_at`

`content` 在 M4 先保持与 `documents.content` 一致的 BlockNote JSON 序列化字符串；`content_format` 固定为显式值 `blocknote_json`。

**Rationale**

1. 当前仓库已经把文档正文稳定保存在 `documents.content` 中，最 lazy 的 M4 起点就是把它提升为“可版本化快照输入”，而不是先发明新的正文编码。
2. `(document_id, version)` 能直接支撑 Citation、恢复、索引与后续历史版本能力，且比全局版本号更容易解释。
3. 增加 `source_document_updated_at` 可以在不读取实时协同态的情况下追溯快照来自哪次 API 侧正文状态。

**Alternatives Considered**

1. 直接把快照正文存成 `jsonb`
   - 放弃原因：当前 `documents.content` 已是字符串真相；M4 先保持同构最省改动，后续若需要 `jsonb` 查询再单独迁移。
2. 让 `document_snapshots` 直接保存 Yjs 二进制
   - 放弃原因：这会把稳定快照和协同运行态重新混在一起，违背文档 17 / 24 的主旨。

### Decision: Snapshot Versions Are Allocated Transactionally In `apps/api`

**Choice**

`snapshotVersion` 由 `apps/api` 在创建快照时按 `documentId` 事务分配，第一版从 `1` 开始，每次成功创建后递增 `+1`。同一事务内同时：

1. 插入 `document_snapshots`
2. 更新 `documents.latestSnapshotVersion`
3. 返回创建结果

失败则全部回滚。

**Rationale**

1. 版本号是服务端真相，不该由前端或 worker 猜测。
2. 事务分配可以把“新快照存在”和“文档指针已前移”绑定在一起，避免半成功状态。
3. 这让后续 `feat-m4-collaboration-persistence-baseline` 只需要决定“何时触发快照”，而不用重定义版本规则。

**Alternatives Considered**

1. 客户端传入目标版本号
   - 放弃原因：版本竞争与并发冲突会立刻失控。
2. 先更新 `documents.latestSnapshotVersion` 再异步补快照行
   - 放弃原因：最容易产生悬空版本指针。

### Decision: Explicit Snapshot Creation Reuses The Latest Snapshot When The Persisted Document Has Not Changed

**Choice**

`POST /api/documents/:documentId/snapshots` 在 M4 采用“显式动作、幂等结果”语义：

1. 如果当前 `documents.content` 与最新快照来源仍是同一份持久化正文真相，则直接返回最新快照
2. 只有当持久化正文自最新快照之后发生变化时，才创建 `version + 1` 的新快照

M4 先用 `documents.updatedAt` 搭配最新快照的 `source_document_updated_at` 做最小判定，不额外引入内容哈希字段。

**Rationale**

1. 这能避免“连点两次保存快照就平白多一版”的假版本膨胀。
2. 继续复用现有 `documents.content + updatedAt` 真相，比新加哈希列更 lazy。
3. 这条规则不会阻碍后续协同持久化子题；它只改变“是否新增版本”，不改变版本分配权。

**Alternatives Considered**

1. 每次显式保存都强制 `version + 1`
   - 放弃原因：版本会被重复点击噪音污染。
2. 新增 `content_hash` 再做去重
   - 放弃原因：M4 基线先不值得为此加字段和迁移。

### Decision: `rag_index_jobs` Uses Explicit Status, Stage, And Supersession

**Choice**

M4 将新增 `rag_index_jobs` 表，并至少包含：

1. `id`
2. `document_id`
3. `target_snapshot_version`
4. `status`
5. `stage`
6. `requested_by_user_id`
7. `attempt_count`
8. `error_code`
9. `error_message`
10. `locked_at`
11. `started_at`
12. `finished_at`
13. `created_at`
14. `updated_at`

`status` 固定为：`pending | running | succeeded | failed | superseded | canceled`。  
`stage` 固定为：`queued | preprocessing | chunking | embedding | upserting | publishing`。

**Rationale**

1. 仅有 `pending/running/succeeded/failed` 不足以表达“旧任务执行完了，但不能发布”的情况。
2. `superseded` 比复用 `failed` 或 `canceled` 更能说明“系统主动防止旧版本覆盖”的业务语义。
3. `stage` 可以保持实现简单，同时为 UI 状态和排障保留足够信号。

**Alternatives Considered**

1. 只保留一个 `status` 字段
   - 放弃原因：用户无法分辨卡在哪一步，worker 日志也不够稳定。
2. 为每个阶段建独立子表
   - 放弃原因：M4 基线过重，完全没必要。

### Decision: One Active Index Job Per Snapshot Version Is Enough

**Choice**

对同一个 `(document_id, target_snapshot_version)`，M4 同时最多只保留一个 active job（`pending` 或 `running`）：

1. 若 `POST /index` 命中同版本 active job，则直接返回该 job
2. 只有针对更新的 `targetSnapshotVersion` 才创建新的 job

**Rationale**

1. 同版重复索引对 M4 没有额外价值，只会制造重复轮询和重复写库风险。
2. 这让 UI 的“正在更新知识库”状态更可解释。

**Alternatives Considered**

1. 允许同版并行创建多个 job
   - 放弃原因：纯噪音，没有产品收益。

### Decision: `latestIndexedVersion` Publishes Only After Full Worker Success

**Choice**

`documents.latestIndexedVersion` 只允许在 worker 完成以下全部步骤后更新：

1. 读取目标快照
2. `packages/document` 完成服务端文档预处理
3. `packages/rag` 完成 chunk / embedding / vector upsert
4. publish gate 判断该 job 仍是允许发布的最新候选

只有全部满足时，worker 才在事务内：

1. 更新 `documents.latestIndexedVersion = targetSnapshotVersion`
2. 将 job 标记为 `succeeded`

如果发现已有更高版本胜出，则 job 改记为 `superseded`，而不是覆盖版本指针。

**Rationale**

1. 这直接落实“失败不破坏上一版已可检索结果”的核心要求。
2. publish gate 是避免旧 job 覆盖新版本的最小必要保护。
3. 将版本切换放在 worker 末尾，比在 API 请求内乐观更新更稳。

**Alternatives Considered**

1. 创建 job 时就先把 `latestIndexedVersion` 设成目标版本
   - 放弃原因：这会让状态撒谎。
2. 任何成功 job 都无条件回写
   - 放弃原因：旧 job 覆盖新版本是 M4 最大的一类一致性 bug。

### Decision: Worker Uses A Time-Based Lease To Recover Stuck `running` Jobs

**Choice**

M4 不引入复杂调度中心，只给 `rag_index_jobs` 一个最小 lease 语义：

1. worker claim job 时写入 `locked_at`
2. 轮询时可重新 claim `pending` job，或 claim `running` 且 `locked_at` 早于超时窗口的 job
3. 重新 claim stale `running` job 时递增 `attempt_count`
4. 仍在 lease 窗口内的 `running` job 不允许被第二个 worker 抢占

**Rationale**

1. 没有 lease，worker 崩掉后 job 会永远卡在 `running`。
2. 只靠 `locked_at + attempt_count` 就能支撑 M4，不必现在就上心跳表或调度中心。

**Alternatives Considered**

1. 不处理 stuck `running`，完全靠人工修复
   - 放弃原因：这会让第一版 worker 太脆。
2. 现在就引入完整队列 / heartbeat 体系
   - 放弃原因：超出 M4 基线。

### Decision: API Contracts Stay Split As `POST /snapshots`, `POST /index`, `GET /status`

**Choice**

M4 只落地三类主 contract：

1. `POST /api/documents/:documentId/snapshots`
2. `POST /api/documents/:documentId/index`
3. `GET /api/documents/:documentId/status`

可选补充 `GET /api/documents/:documentId/snapshots` 用于列表查看，但不把它当成 M4 的核心前置。

**Rationale**

1. 这和文档 27 的职责拆分完全一致。
2. API 名称直白，足够支撑“保存快照”和“保存并更新知识库”两类产品动作。
3. 先把 contract 拆开，后续是否增加组合按钮只是前端交互问题，不会污染后端语义。

**Alternatives Considered**

1. 只留一个 `POST /save-and-index`
   - 放弃原因：现在看似省事，后续发布、重建索引、仅保存快照都会被它反咬。
2. 在 `PATCH /documents/:id` 内偷偷自动生成快照
   - 放弃原因：会把普通正文编辑和稳定版本落地混成一个副作用。

### Decision: `GET /status` Returns The Newest Non-Superseded Job Summary

**Choice**

`GET /api/documents/:documentId/status` 的顶层 `latestIndexJob` 采用最小可解释规则：

1. 优先返回最新的 `pending` 或 `running` job
2. 否则返回最新的 `failed` 或 `succeeded` job
3. `superseded` job 只保留在历史中，不抢占顶层摘要

**Rationale**

1. 用户最关心的是“当前还在跑什么”或“最近一次结果是什么”。
2. 把 `superseded` 顶到最上层只会制造困惑。

### Decision: `packages/document` And `packages/rag` Stay Thin But Real In M4

**Choice**

M4 将正式建立两个共享包边界：

1. `packages/document`
   - 负责 snapshot 内容解析、BlockNote 服务端预处理入口、结构化文本抽取
2. `packages/rag`
   - 负责 chunk 组装、embedding 调用边界、向量写入与 publish 输入输出类型

`apps/worker` 只负责轮询、claim job、调用包边界、回写状态；`apps/api` 不直接跑索引流水线。

**Rationale**

1. 当前这两个包还是空壳，planning 不先钉边界，代码落地时一定会把逻辑散回 `apps/api`。
2. BlockNote 官方已有 `@blocknote/server-util` 的服务端处理入口，可以自然落在 `packages/document`，但我们不必在 planning 阶段承诺完整导出和富格式链路。
3. 这也是后续把数据库轮询换成 `BullMQ` 时最省改动的切点。

**Alternatives Considered**

1. 先全部写进 `apps/api`
   - 放弃原因：请求线程与后台任务边界会立刻混乱。
2. 现在就把所有 RAG 细节做成完整平台包
   - 放弃原因：超出 M4 主线，且当前连基线字段都还没钉死。

### Decision: `apps/worker` Stays Plain Node TS And Talks To PostgreSQL With `pg`

**Choice**

M4 的 `apps/worker` 保持和 `apps/collab` 一样的 plain Node TS 形态：

1. 使用 `tsx + tsc` 作为最小运行与类型检查基线
2. 直接用 `pg` 执行少量 worker 专用 SQL
3. 不在 M4 再引入 `knex`
4. 不把 worker 升级成完整 Adonis app

**Rationale**

1. worker 当前只需要 claim job、读取快照、回写状态和发布版本，SQL 面很小。
2. `apps/api` 已经拥有 Lucid migration 真相；worker 再引一套 `knex` 只会多一层 schema 口径。
3. 这比把 Adonis 宿主拉进 worker 更 lazy。

**Alternatives Considered**

1. `knex + pg`
   - 放弃原因：M4 worker 不需要第二套 query builder 或 migration runtime。
2. 最小 Adonis worker
   - 放弃原因：比 plain Node TS 更重，当前收益不够。

### Decision: M4 Uses Aliyun Bailian `text-embedding-v4` Through The OpenAI SDK Compatibility Endpoint

**Choice**

M4 的 embedding provider 基线固定为：

1. Node 侧使用 `openai` npm 包
2. `baseURL` 指向阿里云百炼 OpenAI 兼容 endpoint
3. `apiKey` 使用 `DASHSCOPE_API_KEY`
4. `model` 固定为 `text-embedding-v4`

M4 先只使用 OpenAI 兼容接口稳定支持的参数；`text_type`、`instruct`、稀疏向量等 DashScope 专有增强暂不在本阶段启用。

**Rationale**

1. 用户当前无法使用 OpenAI 官方 embedding 服务，但可以复用 OpenAI SDK 接百炼兼容层。
2. 这保留了最简单的调用面，同时不阻塞 M4 基线。
3. 后续若要启用 `text_type: 'query' | 'document'`，应由 `packages/adapters` 统一封装 DashScope SDK 或原生 API，避免把 provider 分叉逻辑散进 `packages/rag`。

**Alternatives Considered**

1. 直接切 DashScope SDK
   - 放弃原因：M4 先求最短闭环，优先复用 OpenAI SDK 兼容面。
2. 本地 Ollama embedding
   - 放弃原因：部署和效果变量更大，更适合后续阶段再评估。

### Decision: Embedding Dimensions And Qdrant Collection Shape Are Explicit Configuration

**Choice**

M4 明确将 embedding 维度和 collection 形状作为配置真相，而不是运行时猜测：

1. `EMBEDDING_MODEL=text-embedding-v4`
2. `EMBEDDING_DIMENSIONS=1024`
3. `QDRANT_COLLECTION=document_chunks_v1`

worker 在写入前必须校验 Qdrant collection 的向量维度与 `EMBEDDING_DIMENSIONS` 一致；若不一致则直接失败，不允许继续写入。
同时，写入 Qdrant 的 point id 必须使用其接受的稳定格式（`uint64` 或 UUID）；M4 采用稳定 UUID 形态，避免重试时制造重复脏点。

**Rationale**

1. `text-embedding-v4` 支持可变维度，维度不钉死就很容易把 collection 悄悄写坏。
2. “维度变更需要重建 collection” 本质上是 breaking change，必须显式化。
3. `text-embedding-v4` 默认 1024 维，先贴合当前 provider 默认值能减少额外参数漂移与 collection 重建噪音。

**Alternatives Considered**

1. 沿用模型默认 1024 维且不显式配置
   - 放弃原因：后续切换或误配时风险太高。
2. 运行时自动读取已有 collection 维度并跟随它
   - 放弃原因：最容易把错误配置沉默吞掉。

### Decision: `packages/rag` Owns Provider-Safe Batching, While DashScope-Only Retrieval Tuning Waits For `packages/adapters`

**Choice**

M4 中 `packages/rag` 需要内建两条 provider 约束：

1. 每次 embedding 调用最多发送 10 条文本
2. snapshot chunk 数超过 10 时必须自动分批

同时，`text_type` 暂不直接塞进当前 OpenAI 兼容实现；后续若要区分：

1. 文档入库：`text_type: 'document'`
2. 查询检索：`text_type: 'query'`

则由 `packages/adapters` 统一接入 DashScope SDK / API 支持。

**Rationale**

1. 10 条上限是当前 provider 的硬约束，必须在 `packages/rag` 内消化。
2. `text_type` 是检索质量增强，不是 M4 基线闭环的必要前提。
3. 把 provider 差异留给 `packages/adapters`，比在 worker 或 rag 主流程里写分支更稳。

### Decision: Collaboration Persistence Stays A Separate Change

**Choice**

`feat-m4-collaboration-persistence-baseline` 继续只负责：

1. `apps/collab` 的 `onLoadDocument` 恢复来源
2. `onStoreDocument` 或节流持久化策略
3. Yjs 运行态如何回写到 API 侧正文真相

它不重新设计：

1. `document_snapshots` 字段
2. `snapshotVersion` 规则
3. `rag_index_jobs` 生命周期
4. `latestSnapshotVersion` / `latestIndexedVersion` 语义

**Rationale**

1. 主线 M4 先解决“稳定真相与索引基线”，子题再解决“协同层怎么把更好的内容喂进来”。
2. 这样可以避免 M4 被 `collab↔api` 握手、Yjs 恢复与后台索引三条链路同时拖住。

**Alternatives Considered**

1. 把协同持久化与索引基线合并成一个 change
   - 放弃原因：范围立刻膨胀，而且两个问题的验证闭环不同。

## Risks And Trade-Offs

1. **M4 先以 `documents.content` 作为快照输入，仍不是最终协同真相**
   - 取舍：先建立版本与任务基线，比等待协同持久化一步到位更稳。
   - 缓解：把这个限制明确写进 spec，并把 `feat-m4-collaboration-persistence-baseline` 作为唯一补足来源。

2. **`superseded` 增加了一个 job 状态**
   - 取舍：多一个枚举值，换来“旧任务为什么没发布”的清晰语义。
   - 缓解：只在旧版本保护场景使用，避免把所有非成功结果都塞进去。

3. **`packages/document` 现在就建，会让人误以为 M6 已经开始**
   - 取舍：这里只建立最小边界，不承诺完整导出和富格式能力。
   - 缓解：spec 和 tasks 都明确只做快照解析与索引前处理入口。

4. **Adonis 现有官方 queue 方案已存在，但还在实验期**
   - 取舍：M4 继续坚持数据库记录 + 独立 worker 轮询，更贴合当前仓库的空壳现状。
   - 缓解：在 `packages/rag` 与 worker 接口上保持调度无关，后续可以替换为正式队列。

5. **OpenAI 兼容接口暂时吃不到 `text_type`**
   - 取舍：M4 先保住稳定闭环，不为 retrieval tuning 额外扩 provider 适配层。
   - 缓解：在 planning 中明确 `packages/adapters` 是后续接入 DashScope 专有参数的唯一位置。

## Environment Baseline

M4 完成后，最小 env 基线应包含：

1. `HOST`
2. `PORT`
3. `NODE_ENV`
4. `DB_HOST`
5. `DB_PORT`
6. `DB_USER`
7. `DB_PASSWORD`
8. `DB_DATABASE`
9. `QDRANT_URL`
10. `QDRANT_API_KEY`（可选）
11. `QDRANT_COLLECTION=document_chunks_v1`
12. `DASHSCOPE_API_KEY`
13. `DASHSCOPE_BASE_URL`
14. `EMBEDDING_PROVIDER=aliyun_openai_compatible`
15. `EMBEDDING_MODEL=text-embedding-v4`
16. `EMBEDDING_DIMENSIONS=1024`
17. `WORKER_POLL_INTERVAL_MS`
18. `WORKER_JOB_LEASE_MS`
