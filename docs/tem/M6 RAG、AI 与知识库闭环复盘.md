# M6 RAG、AI 与知识库闭环复盘

## 复盘范围

M6 将 M4 的稳定快照和异步索引、M5 的模型流能力、空间成员权限、Qdrant 检索、HTTP streaming 与 BlockNote 编辑器 Citation 串成了一个可使用的知识库闭环。它覆盖 `packages/rag`、`apps/worker`、`apps/api`、`apps/web`、协同服务和 seed 数据，难点不在于接通某个 SDK，而在于让每一层都不破坏上一层的真相。

本次实现的主约束是：RAG 只能检索用户有权看到且当前索引版本仍有效的文档；模型答案必须能够回到文档来源；快照、索引和当前编辑正文不能被混为同一份状态。

## 1. RAG 的权限问题必须在向量检索之前解决

### 背景

Qdrant payload 中包含 `spaceId`、`documentId` 和 `snapshotVersion`，看起来足以在向量库过滤空间或文档。但这些字段来自索引时的历史数据，不能替代当前用户身份和成员关系。

### 暴露方式

M6 需要处理匿名访问、已存在但无权限的空间、MCP 调用和多文档不同索引版本。若先 embedding 或 Qdrant 查询，再在结果中做前端或服务端过滤，越权请求已经消耗了基础设施，也可能通过响应时间、错误形态或错误配置泄漏信息。

### 影响

权限校验位置错误会使“向量检索结果”变成事实上的权限来源。其后果不只是多一条 bug，而是 HTTP、MCP、worker 和未来 Agent 工具可能各自形成一条绕过路径。

### 当前结论

`space_members` 是唯一权限真相，owner 也必须作为 `role = owner` 的 membership 记录存在。API 先计算 `RagAuthorizedDocument[]`，再由 `packages/rag` 消费这个已授权范围；可选 `spaceId` 只能进一步缩小范围。无权空间必须在 embedding、Qdrant 和模型调用之前返回 `403`，MCP 必须复用同一 scope resolver 或明确拒绝。

### 权限模型设计

#### 资源归属与成员关系分离

M6 没有把空间 owner 再塞回 `spaces` 表，也没有让文档或 Qdrant point 保存一份可用于授权的 owner 字段。`spaces` 负责空间资源本身，`space_members` 负责“哪个用户以什么角色参与哪个空间”：

| 表/边界         | 负责什么                                   | 不负责什么           |
| --------------- | ------------------------------------------ | -------------------- |
| `spaces`        | 空间资源、名称和层级                       | 推断谁有访问权       |
| `space_members` | `space_id + user_id + role` 的唯一成员事实 | 向量过滤、模型上下文 |
| `documents`     | 文档归属空间与 active index version        | 向用户授予空间访问权 |
| Qdrant payload  | 检索候选的空间/文档/版本元数据             | 当前用户授权         |

`space_members` 以 `(space_id, user_id)` 唯一约束避免同一用户在同一空间拥有相互矛盾的角色记录。当前最小角色是 `owner` 和 `viewer`：owner 是空间创建者与后续管理语义的落点，viewer 表示可见/可检索的成员。M6 的 RAG 读取路径只判断是否存在 membership，不把 owner 当成旁路权限，也不从用户创建顺序、seed 顺序或空间名称推断归属。

这是一项刻意的收缩。M6 不包含编辑者、管理员、邀请、组织、继承权限或公开分享；这些能力若要加入，应在 `space_members.role` 与 capability policy 上演进，而不是重新把授权规则散落到 controller 或前端。

#### 新建与迁移的写入规则

新空间创建必须和 owner membership 在同一事务写入。否则会出现“空间已存在，但创建者暂时无权搜索/索引它”的中间状态，重试又可能产生重复 member 行。

旧数据迁移更加严格：历史 `spaces` 没有可靠 owner 字段，因此 migration 先要求 `legacy_space_owner_mappings` 提供人工确认的 `space -> user` 映射；若有任何旧空间未映射，直接中止 migration，而不是猜测第一个用户、最近编辑者或 seed 用户为 owner。完成验证后再写入 owner membership。这一策略宁可阻塞迁移，也不允许一次错误回填永久扩大数据可见范围。

#### 授权范围的求值顺序

RAG 请求遵循下面的固定顺序：

1. HTTP auth 取得当前 user；匿名请求在 controller/middleware 边界返回 `401`。
2. 若请求带 `spaceId`，`SpaceMembershipService.hasSpaceAccess` 先检查 membership；失败立即返回 `403`。
3. `listVisibleDocuments(userId)` 通过 `documents JOIN space_members` 构造 `RagAuthorizedDocument[]`，同时带出每个文档的 `latestIndexedVersion`。
4. API 将该范围作为 `RagRetrievalScope` 传给无身份、无数据库依赖的 `packages/rag`；可选空间条件只能在此已授权集合内收缩。
5. 只有范围内存在 active indexed document 时，才允许创建 query embedding、调用 Qdrant 和把命中交给模型。

因此“无权空间”与“当前范围没有索引”是两种不同状态：前者是明确拒绝，不能泄漏或消耗检索资源；后者是已授权范围内的空知识状态，返回可解释的空结果。这个顺序也让单元测试能断言越权路径根本没有调用 embedding、retrieval 或 model。

#### HTTP、MCP 与前端的边界

前端空间选择器只是 narrowing input，绝不是权限依据。即使浏览器篡改 `spaceId`，服务端仍会在查询向量库前拒绝。HTTP RAG 入口使用同一个 member scope resolver；MCP `search_knowledge` 目前没有能映射到 `space_members` 的用户身份，因此选择 fail closed，直接返回未授权而不实例化 `RagService`。这比“先给 MCP 一个全局只读搜索，再以后补权限”更安全，也明确暴露了 MCP identity mapping 是后续能力而非已完成能力。

#### 当前未解决的演进问题

当前 `viewer` 是“可读取且可检索”的粗粒度角色，尚未区分 `canRead`、`canEdit`、`canManageMembers`、`canIndex` 等 capability。文档页已有编辑和索引操作，未来应把这些动作改为 capability policy，而不是继续用 `role === 'owner'` 的条件分支堆叠。另一个待决问题是 workspace/组织层级：目前 `workspaceId` 与 `spaceId` 在 RAG scope 中同值，真正引入工作区后必须重新定义 workspace membership 与 space membership 的继承关系，并保持“先授权、后检索”的顺序不变。

### 值得复盘的问题

以后引入 rerank、Agent 或跨空间检索时，是否仍能保证所有检索入口只接收已授权的 document scope，而不是在向量 payload 上新增一套权限判断。

## 2. AI 与 RAG 如何实现

### 总体分层

M6 没有让页面直接调用模型或向量库，也没有让 `packages/rag` 读取 HTTP session、Adonis model 或环境变量。实现按“业务 contract -> 领域处理 -> 基础设施适配 -> HTTP/Web”分层：

| 层              | 实现位置                      | 责任                                                                         |
| --------------- | ----------------------------- | ---------------------------------------------------------------------------- |
| 共享 contract   | `packages/contracts`          | `RagIndexBlock`、授权 scope、Citation、search/chat request 与 stream event   |
| RAG 领域层      | `packages/rag`                | BlockNote block 预处理、向量维度校验、active-version 命中过滤、稳定 point ID |
| AI runtime      | `packages/ai`                 | 将 chat/embedding 统一为 AI SDK 可调用的 runtime，校验模型种类               |
| 供应商适配      | `packages/adapters` + API env | 将阿里云百炼 OpenAI-compatible 配置与 fetch 注入 runtime                     |
| API application | `apps/api`                    | 认证、member scope、Qdrant adapter、检索编排、SSE transport 与错误边界       |
| Web             | `apps/web`                    | API envelope/SSE 消费、view-model、取消、Citation 与页面状态                 |

这使模型供应商、向量库 client 和 HTTP stream 事件都不会直接渗透到页面或 RAG 领域层。后续更换模型或向量库时，优先替换 adapter/runtime，而不是重写权限与 Citation 规则。

### 索引链路：从 BlockNote 快照到可引用向量点

文档不是在用户每次输入时即时索引。用户先保存正文、创建稳定快照，再提交 index job；worker 读取指定 snapshot 的原始 BlockNote blocks，按树形结构遍历：

1. 只读取具有稳定 `block.id` 且含有效 text inline content 的 block，空块不生成向量点。
2. 维护 heading path，使每个 chunk 带有当前标题上下文，而不只是一段脱离语境的纯文本。
3. 每个 block 当前生成一个 `chunkId = blockId:0`，并写入 `workspaceId`、`spaceId`、`documentId`、`snapshotVersion`、`blockId`、`chunkId`、`headingPath`、`plainText`。
4. 文本按最多 10 条一批调用 embedding；每个返回向量必须与配置的 collection dimensions 一致。
5. 用 `documentId:snapshotVersion:blockId:chunkId` 的 SHA-256 派生 UUID 形态 point ID，满足 Qdrant 对 ID 格式的限制并保证同一快照重跑幂等。
6. worker upsert 后清理同一 document/snapshot 已不在本次结果中的旧 points；最后由 publish gate 判断该 snapshot 是否仍是最新目标，只有通过才发布 active indexed version。

这条链路的关键不是“把文字变成 embedding”，而是所有点都能回到一个不可变快照中的一个真实 BlockNote block。缺字段的历史点会被隔离，不能伪造成可点击 Citation。

### 检索与生成链路

用户提交 search 或 chat 后，API 先完成第 1 节的成员范围计算，再执行以下链路：

```text
用户问题
  -> query embedding
  -> Qdrant filter(documentId + active snapshotVersion)
  -> packages/rag 二次校验 payload、授权文档和 active version
  -> bounded RagSearchHit[] + Citation
  -> chat 时将命中上下文交给 AI SDK streamText
  -> RagStreamEvent SSE
  -> Web 归约为答案、来源和 Citation 跳转
```

Qdrant filter 只接收已授权文档及对应 active version 的 OR 条件；`packages/rag` 在 client 返回后再次验证 payload 的完整性、space/document identity 和 version，避免基础设施过滤错误或遗留点直接进入模型上下文。没有 active indexed document 时，系统返回空检索结果，不创建 embedding 请求。

### AI runtime 与供应商约束

`packages/ai` 使用 AI SDK 的 OpenAI provider，但明确走 chat/completions 兼容路径：

- chat 通过 `provider.chat(model)` 与 `streamText` / `generateText` 执行；
- embedding 通过 `provider.embedding(model)` 与 `embedMany` 执行，并把配置 dimensions 作为 provider option 传入；
- runtime 会校验调用的是 chat model 还是 embedding model，避免把两类模型引用混用；
- 阿里云百炼相关 base URL、API key、模型名和 `enableThinking: false` 由 API runtime config 和 adapter 收口，不进入业务 contract。

RAG chat 的 system prompt 要求只依据检索上下文回答，context 中按 Citation 标识附带命中原文。当前实现仍将稳定 Citation identity 暴露给模型，Web 对已知稳定 ID 与模型简写做兼容映射；更理想的下一步是由服务端先生成 `c1`、`c2`，再维护它们到稳定 identity 的映射，减少模型改写内部 ID 的可能。

### 流式传输与前端消费

chat 不是 WebSocket，也不是持久化对话。`RagService.prepareChat` 先完成可失败的检索准备，之后才返回 async generator，事件顺序为：

```text
start -> retrieval -> text-delta* -> citation* -> finish
```

如果 stream 开始后发生模型或 transport 失败，使用 `error` 终止，不能伪造成功 `finish`；浏览器取消会触发 `AbortController`，服务端关闭上游 iterator。Web 的 `streamRagChat` 负责解析 SSE frame、保留终止事件语义，并把 event 数组归约为单轮页面 view-model。页面不直接解析 AI SDK/provider shape，也不暗示会话已经持久化。

### 当前能力边界

M6 是最小可验证闭环，尚未实现：多块语义切分、rerank、查询改写、引用级 answer grounding 校验、持久化多轮会话、Agent 工具编排、跨 workspace 继承权限或 MCP 用户身份映射。它们都应在现有 contract 和 scope 边界上增量设计，不能为了增加“智能”重新绕开快照、成员范围或 Citation 可追溯性。

## 3. 检索、Chunking 与向量数据库策略

### 文档如何存储

DocWeave 不把原始文档只存进向量库。当前正文存于 PostgreSQL 的 `documents.content`，格式是 BlockNote JSON；创建稳定快照后，`document_snapshots.content` 保存某一 version 的不可变 BlockNote JSON。Qdrant 只保存从该快照派生出的向量点与用于检索/Citation 的 payload，不承担正文唯一副本、权限真相或历史版本真相。

这意味着原文查看、编辑和 Citation 回跳永远回到应用数据库中的当前文档/快照语义；向量库可以重建，不能反向成为内容源。

### 当前 Chunking 策略：Block-level，不是固定 token window

M6 采用“一个有文本的 BlockNote block = 一个 chunk”的基线策略：

| 维度           | 当前实现                                                     |
| -------------- | ------------------------------------------------------------ |
| 切分单元       | 每个具有稳定 `block.id` 且含文本内容的 block                 |
| 递归           | 遍历 `children`，嵌套 block 同样独立索引                     |
| 标题上下文     | 遇到 heading 时维护层级栈，写入 `headingPath`                |
| chunk ID       | `blockId:0`；当前每个 block 只有一个 chunk                   |
| 文本清洗       | 连接 text inline content、压缩空白、trim；不索引空文本 block |
| 重叠窗口       | 无；不按 token 数切窗，也没有 overlap                        |
| embedding 批次 | 最多 10 个 chunk 一批，减少 provider 调用次数                |

选择 block-level 的原因不是它在所有语料上最优，而是它天然保留 BlockNote 的稳定 ID，能让检索结果精确回跳到编辑器中的可见证据。对于当前以段落、标题和列表为主的知识文档，这比“任意字符切段”更可审计。

代价也很明确：长段落会形成过大的 embedding 单元，短列表项又可能过碎；同一语义跨多个 block 时没有上下文窗口；表格、复杂 inline 节点、图片/OCR 目前没有专门策略。因此 M6 的 chunking 是 Citation-first 的最小基线，而不是最终的召回优化方案。

### Qdrant 数据模型与检索过滤

向量库使用 Qdrant，collection 由 `QDRANT_COLLECTION` 配置，默认 `document_chunks_v1`。worker 在 collection 不存在时创建单向量 collection，距离度量为 `Cosine`，向量维度由 embedding 模型配置决定；若已有 collection 的维度不一致，job 直接失败而不是静默写入。

每个 point 包含：

```text
id      = hash(documentId, snapshotVersion, blockId, chunkId) -> UUID 形态
vector  = embedding(plainText)
payload = workspaceId, spaceId, documentId, snapshotVersion,
          blockId, chunkId, headingPath, plainText
```

检索时先把 member-derived 的授权文档及其 `latestIndexedVersion` 转成 Qdrant `should` filter：每个条件同时匹配 `documentId + snapshotVersion`。Qdrant 返回候选后，`packages/rag` 再做一次完整 payload、space/document identity 和 active version 校验，随后按 score 稳定排序并截断。HTTP `limit` 和 chat `topK` 当前均被 validator 限制为不超过 20。

双重过滤的目标不是追求性能技巧，而是把“基础设施过滤正确”当作不可信前提：即使 collection 中残留旧点、payload 不完整或 adapter filter 配置错误，领域层也不会把它交给模型。

### 数据量级与当前性能结论

开发 seed 当前生成 5 个主题空间、10 篇中文长文档；实际 point 数取决于每篇文档中有文本的 BlockNote block 数，而不是文档数。M6 已在这个小规模基线上验证了索引、检索、Citation 回跳和权限隔离，但**没有完成可用于生产承诺的压测**，因此没有可信的 QPS、P95 延迟、内存占用或百万级 point 容量结论。

已经观察并处理的性能/可靠性瓶颈是：

1. embedding provider 调用是索引阶段主要外部耗时，所以实现了 10 条批处理，而不是逐 block 请求。
2. 同一 document/snapshot 重建时，旧 block point 若不删除会造成召回脏数据和 Citation 失效，因此 upsert 后按当前 point ID 清理同版本 stale points。
3. query 前若没有 active indexed document，直接返回空结果，避免无意义 embedding 与 Qdrant 请求。
4. scope filter 中的文档数量随用户可见文档增长；当一个用户可见空间很多时，`should` 条件会变长，这尚未做分区或分批检索优化。

未测得的性能瓶颈不应被写成“已解决”。真正进入更大规模前，需要基于目标模型维度、文档长度分布、并发用户数和权限范围分布建立压测基线。

### 动态与持续更新如何实现

M6 采用快照驱动的异步增量更新，而不是“正文一改就同步改向量”：

```text
保存当前正文
  -> 创建/复用 stable snapshot
  -> 创建或复用 rag_index_job
  -> worker 领取 job（lease + SKIP LOCKED）
  -> chunk / embed / upsert / 清理同版本 stale points
  -> publish latestIndexedVersion 或标记 superseded/failed
```

这条链路已处理的动态更新策略包括：

- 正文未变化时复用快照，避免重复版本和重复索引。
- 同一目标 snapshot 的 job 可复用，避免重复入队。
- worker 以 lease 领取 job，异常退出后过期 job 可再次被领取。
- 较旧 job 若在发布阶段发现 document 已有更高 indexed version，会标记 `superseded`，不回退线上检索版本。
- 同一 snapshot 重建时删除当前 blocks 中已不存在的 points；空快照也会清掉旧 points。
- search/chat 只读取每个文档当前 `latestIndexedVersion`，因此历史 snapshot 即使保留在 Qdrant 中也不会参与当前回答。

仍未完成的持续更新能力包括：基于 block diff 的局部 embedding、embedding cache、任务队列与并发控制、重试/死信策略、collection alias 蓝绿重建、监控指标、索引 freshness SLO、混合检索和 rerank。这些是规模化优化的候选项，而不是 M6 已有能力。

### 后续方案：PostgreSQL 全文搜索兜底 + Qdrant 语义检索增强（未实现）

当前 M6 搜索页只有 Qdrant 通道；当可见范围尚无 active indexed version、索引 job 尚在运行或向量服务异常时，页面会明确提示“无索引/索引失败”，不会提供关键词结果。为避免向量索引延迟或语义质量波动直接使搜索页不可用，下一阶段应建立双通道：

| 通道            | 解决的需求                                          | 数据来源与新鲜度                                                 | 返回定位                                     |
| --------------- | --------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------- |
| PostgreSQL FTS  | 精确关键词、标题、术语、ID、短语命中；索引延迟兜底  | 当前已保存正文的 BlockNote plain-text projection，保存后同步更新 | 当前文档 `blockId`，标记“实时正文”           |
| Qdrant semantic | 同义表达、自然语言问题、跨措辞召回；RAG chat 上下文 | stable snapshot 的 active indexed version，异步更新              | `snapshotVersion + blockId`，可作为 Citation |

#### 设计原则

1. **同一权限 scope 先行**：两个通道都先由 `space_members` 计算授权文档范围。FTS 不能因为在 PostgreSQL 内就绕开 scope，也不能让搜索页用未授权文档做关键词匹配。
2. **同一内容投影，两个时态**：从 BlockNote JSON 复用统一的 plain-text/block 提取器。FTS 投影跟随已保存的当前正文，解决 freshness；Qdrant 只跟随稳定 snapshot，保证模型证据可复现。UI 必须显式标注“实时正文”与“已索引快照”，不能伪装成同一个版本。
3. **不要直接混合 score**：`ts_rank_cd` 与 cosine similarity 不在同一量纲。第一版应在搜索页分区展示“精确匹配”和“语义相关”，或先在各自通道做 rank，再以 Reciprocal Rank Fusion (RRF) 合并并携带 `lexical | semantic | both` 来源标签；不能做 `tsRank + vectorScore` 这类无校准相加。
4. **chat 不以 FTS 伪装 RAG fallback**：语义索引不可用时，搜索页可以继续提供 FTS 文档发现；RAG chat 仍应明确告知当前范围尚未建立稳定语义索引。除非未来为 FTS 结果建立独立的可追溯 context contract，否则不能把实时正文直接塞进“基于 stable snapshot 的回答”。

#### PostgreSQL FTS 落地草案

建议新增 block-granular 的投影表，而不是只给整篇 `documents.content` 做 `ILIKE`：

```text
document_search_entries
  document_id, space_id, block_id, document_revision,
  title_text, plain_text, search_vector, updated_at

UNIQUE(document_id, block_id)
GIN(search_vector)
BTREE(space_id, document_id)
```

`search_vector` 由标题、摘要、heading path 和 block plain text 组合生成；保存文档的事务或可靠 outbox 在正文成功持久化后更新该 projection，并删除已不存在的 block entry。查询使用 `websearch_to_tsquery`/`plainto_tsquery` 与 `ts_rank_cd`，先 join 授权 document scope，再做可选 space narrowing、rank 和 limit。

中文分词是这个方案不能略过的前置条件：PostgreSQL 默认 `simple` configuration 不能提供理想的中文词边界。部署环境需明确选用并验证 `zhparser`、`pg_jieba` 或由应用层统一分词后写入 token projection；同时为代码、英文术语、UUID 和精确短语保留 raw token/trigram 策略。没有完成 tokenizer 评测前，不能声称 PostgreSQL FTS 已经能可靠覆盖中文“精确命中”。

#### 搜索页运行策略

```text
请求 -> auth/member scope -> 并行查询 FTS 与 Qdrant
  FTS 成功 + semantic 成功  -> 展示/融合两类结果与来源标签
  FTS 成功 + semantic 延迟/失败 -> 展示精确匹配，并提示“语义索引更新中/暂不可用”
  FTS 空 + semantic 成功      -> 展示语义结果
  两者均空                    -> 展示无匹配
  权限失败                    -> 两个通道均不查询，返回 401/403
```

向量通道应设置超时、熔断和可观测错误，但 FTS 兜底不能吞掉 Qdrant 的权限/契约错误；只有在 scope 已成功建立后，基础设施可用性才允许降级。结果对象需要新增 `retrievalSource`、`documentRevision`/`snapshotVersion` 和 `isCitationCapable`，使页面知道哪些结果可直接作为 RAG Citation，哪些只能跳到当前正文。

#### 验收与性能指标

这项方案完成前至少应验证：无向量索引时关键词搜索可用；Qdrant 异常不影响 FTS；无权限用户不触发任一通道；当前正文保存后 FTS projection 可见；旧 snapshot 只影响 semantic 通道；重复命中可正确去重/标记 `both`。性能上分别记录 PostgreSQL FTS P50/P95、Qdrant P50/P95、融合耗时、两通道命中率、vector index lag、FTS projection lag、无结果率和 Citation 点击率，再按数据量级决定是否做分区、缓存、payload index 或 rerank。

### 下一阶段的检索优化路线

后续优化应以离线评测和真实查询日志为依据，而不是直接堆叠算法：

1. **改进 chunking**：对超长 block 按 token/句子二次切分并保留 parent block ID；对相邻短 block 进行标题范围内合并；为每个 child chunk 维护可回跳的 parent/offset。
2. **提高召回**：查询改写、多 query、hybrid dense + keyword retrieval、metadata filter 和可配置 topK。
3. **提高排序**：先高召回，再用 cross-encoder 或 LLM rerank；需要以延迟预算和评测集决定是否启用。
4. **提高答案可信度**：用 `c1/c2` 映射、句子级 Citation 覆盖率、引用与答案的 entailment/grounding 检查、无充分证据时拒答。
5. **提高索引效率**：hash 去重、embedding cache、block diff、批量 upsert、collection alias 和后台队列治理。
6. **提高可观测性**：记录 query embedding 耗时、Qdrant filter 命中数、topK 分数分布、rerank 耗时、引用点击率、无结果率和索引滞后时间；日志不得记录无权限正文。

每一步都必须保留 M6 的三个不变量：权限先裁剪、只检索 active snapshot、每个最终 Citation 可回到稳定 block 身份。

## 4. “已保存、已快照、已索引”是三份不同的真相

### 背景

文档编辑页同时存在当前草稿、数据库正文、协同 Yjs 正文、稳定快照和 Qdrant active indexed version。它们会在不同时间更新，不能用一个“保存成功”状态覆盖。

### 暴露方式

用户遇到过保存提示成功但数据库正文未变、首次打开就显示未保存、索引旧快照却被问答命中，以及协同服务最后一个客户端断开后重新进入文档恢复旧正文等现象。单独看都像页面 bug，实际上都来自版本边界没有显式化。

### 影响

如果 UI 不区分这些状态，用户不知道何时能搜索当前内容；如果检索层不按每个文档的 `latestIndexedVersion` 过滤，旧点会给出看似合理但无法追溯的答案；如果协同缓存不在最后一个客户端断开时落库，编辑器会造成丢稿错觉。

### 当前结论

业务保存只更新当前正文；“创建稳定快照”固定一份可追溯版本；“更新知识库”只提交异步索引任务；只有 worker 发布 active indexed version 后才可搜索。RAG retrieval 必须按每个授权文档的 active version 过滤。协同服务在最后一个客户端断开时强制持久化 Yjs 正文，但该动作不替代业务快照。

### 值得复盘的问题

后续引入发布、审批或历史版本浏览时，是否应把这三类版本状态收敛为一个显式状态机，避免页面分别推断数据库、job 和协同状态。

## 5. Citation 不是一个链接，而是一条跨层身份链

### 背景

Citation 从 Qdrant point 开始，经过 `RagCitation`、SSE 事件、模型回答文本、Web view-model，最终需要在 BlockNote DOM 中定位 `data-id`。每一层对 ID 的表达方式都可能不同。

### 暴露方式

实现过程中先后出现过：旧 Qdrant point 没有完整 payload、引用点击后提示块已变更、UUID 作为 `#id` CSS selector 时语法非法、BlockNote 重绘后临时 class 消失，以及模型把稳定 ID 简写为 `document:snapshot:block:0`，而检索层实际 ID 是 `document:snapshot:block:block:0`。

### 影响

如果只验证“搜索结果有 Citation”，很容易忽略最后一公里。用户看到的是 Citation 已定位但没有高亮，或答案中直接泄漏超长索引键。这样会让 RAG 最重要的可信度机制变成噪音。

### 当前结论

索引 payload 必须具备完整 `documentId`、`snapshotVersion`、`blockId`、`chunkId` 等字段，旧 payload 不得伪造 Citation。编辑器使用 BlockNote 官方 `getBlock` / `setTextCursorPosition` 做定位，再由路由状态生成基于 `data-id` 的 scoped CSS，避免 DOM 重绘丢失高亮。Web 只把当前来源集合中的稳定 ID 及模型简写映射为短序号 `[1]`，未知方括号文本不替换；来源列表保留可跳转摘录。

### 值得复盘的问题

Citation ID 是否应该在模型上下文阶段就使用明确的 `c1`、`c2` 标签，并由服务端维护标签到稳定身份的映射，从根源消除模型自行简写索引 ID 的不确定性。

## 6. 流式问答的正确性取决于终止语义，而不是“能逐字输出”

### 背景

M5 已具备 AI SDK 流能力，M6 需要把它与一次授权检索组合，并通过 HTTP SSE 暴露为 `start -> retrieval -> text-delta/citation -> finish`。

### 暴露方式

普通成功路径很容易实现，但取消、检索失败、模型异常、编码异常和 iterator cleanup 失败会发生在 stream 已经开始之后，无法再退回普通 JSON error envelope。若仍发送 `finish`，前端会把失败的答案误认为完成。

### 影响

没有明确 terminal event 的流会让 UI 状态、资源释放和可重试性各自漂移。用户点击停止后如果服务端仍继续转发模型输出，既浪费成本，也可能污染下一次交互的本地状态。

### 当前结论

stream 启动前的认证、校验、权限与检索准备失败必须使用共享 HTTP error envelope；启动后的故障必须用稳定的 `error` 业务事件收口，且不能再发送成功 `finish`。客户端使用 `AbortController`；服务端监听连接关闭并关闭上游 iterator。测试覆盖了 event 顺序、terminal 后不再读取、取消和 cleanup failure。

### 值得复盘的问题

未来加入多轮会话或工具调用时，是否需要把 stream protocol 独立成可版本化的 transport contract，并提供统一的前端 state machine，而不是由各页面手写事件归约。

## 7. Seed 数据和本地联调不是展示材料，而是功能基线

### 背景

RAG 需要真实可检索的正文、稳定快照、索引状态和成员权限。原先英文短文档与遗留空间数据无法有效验证中文检索、BlockNote 内容、Citation 与空间隔离。

### 暴露方式

开发中反复出现“服务已启动但登录不可用”“页面说没有索引”“回答引用到旧块”等问题。部分根因不是代码逻辑，而是 seed、数据库、协同缓存与 Qdrant 历史点不在同一基线。

### 影响

若把 seed 当作附属演示数据，开发环境会持续制造伪 bug，测试只证明 mock 行为，无法说明用户真正能完成“文档 -> 快照 -> 索引 -> 搜索 -> 问答 -> 原文回跳”的闭环。

### 当前结论

seed 已重置遗留英文空间，创建符合最新 membership 模型的中文 RAG、Agent、LLM、Skill、MCP 空间和长 BlockNote 文档，并为索引状态提供可重建基线。后续 seed 变更应同时考虑数据模型、BlockNote 格式、snapshot/index 状态和默认登录账号的可用性。

### 值得复盘的问题

是否应提供一个可重复执行的开发基线命令，一次性清理旧索引、重新 seed、创建快照并触发最小索引，以替代人工逐项恢复。

## 8. 工作流收口和 Git 收口必须被视为独立交付面

### 背景

M6 结束时不仅要通过多包测试，还要同步 `tasks.md`、状态哈希、decision-point audit 和 delta specs，然后快进合并到主分支。

### 暴露方式

`ssf` closing script 能检查并刷新工件，但不会自动完成 `executing -> closing` transition；transition 又会因为未标记 `spec_merged` 而被 guard 拦截。Windows 下 `ssf sync` 对 change 路径的拼接还生成了错误的 `specs/changes/...` 目录，必须校验目标路径并恢复到标准主规范位置。

### 影响

功能实现完成不等于 change 可关闭，更不等于 Git 可合并。若把这些步骤当作结尾杂务，容易在提交时遗漏主规范或把错误生成目录带入仓库，造成规范与实现脱节。

### 当前结论

收口要显式验证：测试结果、任务勾选、`ssf state rebuild/check/audit`、delta spec 合并、`spec_merged` 记录、状态 transition、暂存范围和 `--ff-only` 合并。对 CLI 生成路径必须先查看输出，再做受限的文件移动/清理，不能默认“命令退出码为 0 就表示语义正确”。

### 值得复盘的问题

是否应修复 `ssf sync` 的 Windows path handling，并让 closing wrapper 在满足前置条件后明确完成 transition 与 spec sync，减少人工状态编排。

## 隐性关键点汇总

1. 向量库是检索基础设施，不是权限数据库；任何未来 RAG 入口都应先获得 member-derived scope。
2. Citation 的价值由“可回到证据”决定，不由“模型输出了一个 ID”决定；ID 表达需要端到端治理。
3. 真实开发数据、协同缓存、snapshot 和 Qdrant 历史点会共同决定联调结论，不能只依赖单元测试。
4. 流式协议和工作流状态机都属于产品能力的一部分，失败与收口路径必须和成功路径同等设计。
