# 设计说明

## Context

`feat-m4-collaboration-persistence-baseline` 当前只有 `proposal.md`，但仓库代码和上一阶段工件已经提供了足够清晰的起点：

1. `apps/collab/src/server.ts` 已经保留 `onLoadDocument` / `onStoreDocument` hook，只是仍然停留在纯内存 `Y.Doc`。
2. `apps/api` 已经通过 `DocumentProcessingService`、`document_snapshots`、`rag_index_jobs` 和 `documents.latestSnapshotVersion/latestIndexedVersion` 建立了稳定快照与索引基线。
3. `packages/adapters` 已经承担 `content string <-> structured content` 的转换职责。
4. `packages/editor` 已经在前端使用 `@blocknote/core/yjs` 的 `blocksToYDoc` 做空房间 seed。
5. 当前文档页仍然是“前端 seed + 手动保存文档”的过渡态，服务端恢复与自动持久化语义尚未真正落地。

因此，这个 change 的核心问题已经不是“协同能不能跑”，而是：

1. `apps/collab` 应该从哪份服务端真相恢复 `Yjs`
2. 自动持久化到底写到哪里
3. 自动持久化与显式稳定快照动作如何避免职责重叠

## Goals

1. 让 `apps/collab` 在 `onLoadDocument` 时能够从服务端稳定正文恢复 `Y.Doc`，不再依赖浏览器首帧 seed 作为唯一来源。
2. 让 `onStoreDocument` 的自动持久化先回写 `documents.content`，建立“实时层可恢复”的最小闭环。
3. 明确自动持久化不创建 `document_snapshots`，显式稳定快照动作继续由 M4 第一阶段已有 API 负责。
4. 把格式转换尽量收口到 `packages/adapters`，避免 `apps/collab` 直接散落第三方格式细节。
5. 保持 `apps/web` 改动最小，只移除对 seed 作为唯一正文真相的依赖，不重做文档页交互。

## Decisions

### Decision: `onLoadDocument` Restores From API-Owned Persisted Document Truth

**Choice**

M4 第二阶段中，`apps/collab` 的 `onLoadDocument` 恢复顺序固定为：

1. 先看当前进程内是否已有该房间的 `Y.Doc`
2. 若没有，则调用 `apps/api` 的内部协同恢复端点读取当前 `documents.content`
3. 将返回的序列化 BlockNote JSON 转成 `Y.Doc`
4. 若正文为空或不存在，则退回空文档

M4 第二阶段先不直接从 `document_snapshots` 恢复协同运行态。

**Rationale**

1. 当前第一阶段已经明确 `documents.content` 是可更新的正文真相，而 `document_snapshots` 是显式稳定版本真相。
2. 协同恢复追求的是“重连后别空”，不是“每次都恢复到显式快照版本”。
3. 直接读 `documents.content` 比再引一层“最新 snapshot 解析规则”更省事，也更贴合当前编辑器保存链路。

**Alternatives Considered**

1. 优先从 `latestSnapshotVersion` 对应的 `document_snapshots.content` 恢复
   - 放弃原因：会让协同房间恢复落后于最近一次已持久化正文，反而制造“编辑态比稳定快照旧”的困惑。
2. 继续只依赖浏览器 seed
   - 放弃原因：服务端重启后无法恢复，仍然没有真正的协同正文真相。

### Decision: Automatic Collaboration Persistence Updates `documents.content` Only

**Choice**

M4 第二阶段将自动持久化的职责限定为：

1. `onStoreDocument` 或等价节流持久化将当前协同正文回写到 `documents.content`
2. 自动持久化不创建 `document_snapshots`
3. 自动持久化不更新 `latestSnapshotVersion`
4. 自动持久化不触发索引任务

**Rationale**

1. 这一阶段的首要目标是让实时层可恢复，而不是把“每次房间存储”都升级成版本事件。
2. 如果自动持久化顺手创建 snapshot，很容易把快照版本膨胀成“每次协同空闲都+1”。
3. 把自动持久化限制在 `documents.content`，能最大限度复用现有 API 与适配层。

**Alternatives Considered**

1. 每次 `onStoreDocument` 都自动创建稳定快照
   - 放弃原因：会把实时层存储和版本化事件重新混为一谈。
2. 自动持久化直接触发 snapshot + index
   - 放弃原因：这会把 M4 第二阶段又扩回索引主线。

### Decision: Explicit Snapshot Actions Stay Separate From Automatic Persistence

**Choice**

M4 第二阶段继续保持三类动作分离：

1. 协同自动持久化：只更新 `documents.content`
2. 显式保存文档：继续更新标题、摘要、正文 patch
3. 显式稳定快照 / 保存并更新知识库：继续走第一阶段已有 `POST /snapshots` / `POST /index`

第二阶段不把“自动持久化成功”解释为“已经创建稳定快照”。

**Rationale**

1. 这样可以避免用户误以为“刚打完字就已经形成了可检索版本”。
2. 这也避免把文档页现有保存交互一口气改成两层副作用。
3. 第一阶段已经把快照和索引 contract 拆开，第二阶段不应反向把它们揉回自动持久化。

**Alternatives Considered**

1. 把当前保存文档按钮改成必然创建 snapshot
   - 放弃原因：这会改变现有按钮语义，扩大前端和 API 改动面。

### Decision: `apps/collab` Talks To `apps/api` Through Minimal Internal Runtime Endpoints

**Choice**

M4 第二阶段中，`apps/collab` 不直接写数据库，而是调用 `apps/api` 的内部协同正文端点：

1. `GET /api/internal/collaboration/documents/:documentId/runtime`
2. `PUT /api/internal/collaboration/documents/:documentId/runtime`

这两个端点只负责“读取当前正文真相”和“回写当前正文真相”，不负责 snapshot/index。

M4 先使用最小共享 secret 校验内部调用，不引入新的队列或消息系统。

**Rationale**

1. 现有数据库真相、迁移、Lucid 模型都在 `apps/api`，让 `apps/collab` 直写 DB 会多出第二套持久化口径。
2. 通过内部 API，Lucid 事务、DTO 转换和后续演进都继续留在 `apps/api`。
3. 当前只有两个简单动作，HTTP 内部端点已经足够，不值得再引入新基础设施。

**Alternatives Considered**

1. `apps/collab` 直接使用 `pg` 更新数据库
   - 放弃原因：会把数据库写规则分叉到第二个进程。
2. 引入消息队列异步回写
   - 放弃原因：超出第二阶段范围。

### Decision: Server-Side Collaboration Content Conversion Belongs In `packages/adapters`

**Choice**

M4 第二阶段新增的服务端正文转换 helper 应优先落在 `packages/adapters`，例如：

1. 序列化正文字符串 -> `DocumentContent`
2. `DocumentContent` -> `Y.Doc`
3. `Y.Doc` / `Y.XmlFragment` -> 序列化正文字符串

`apps/collab` 只调用这些 helper，不直接散落 BlockNote / Yjs 细节。

**Rationale**

1. `packages/adapters` 已经是当前仓库的 shape 转换层。
2. 这类转换既不是 HTTP 逻辑，也不是页面逻辑，放在适配层最合适。
3. 这样后续若要替换转换实现，只需要收口在一个地方。

### Decision: Frontend Seed Falls Back Only When Server Restoration Is Empty Or Unavailable

**Choice**

第二阶段不删掉现有 seed fallback，但改变它的定位：

1. 只在服务端恢复为空、协同服务不可用或本地降级编辑时兜底
2. 不再把 seed 当作主要正文来源
3. 一旦服务端恢复的 `Y.Doc` 已经有内容，前端 `seedCollaborationFragment(...)` 不应再覆盖它

**Rationale**

1. 这保留了当前文档页的容错体验。
2. 同时也让 seed 从“主真相”降级为“最后兜底”。

## Risks And Trade-Offs

1. **自动持久化只更新 `documents.content`，不会立刻形成稳定版本**
   - 取舍：先保证实时层可恢复，比同时绑定 snapshot 语义更稳。
   - 缓解：继续保留显式 snapshot/index API 作为稳定版本入口。

2. **内部 API 增加了 collab -> api 这一跳**
   - 取舍：多一次本地 HTTP 调用，换来数据库口径不分叉。
   - 缓解：接口只保留最小正文读取/回写，不扩成通用内部平台。

3. **前端文档页仍会保留本地降级路径**
   - 取舍：让服务异常时页面仍可编辑。
   - 缓解：明确降级态不是协同正文真相，只是可用性兜底。
