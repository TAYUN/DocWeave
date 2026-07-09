# 设计说明

## Context

DocWeave 当前已经完成 M2 的主业务元数据与单人编辑基线，但还没有真正进入 M3 的“协同最小闭环”。

当前代码事实如下：

1. `apps/collab` 仍为空目录，没有实时协同服务进程。
2. `apps/api/app/controllers/collaboration_tokens_controller.ts` 仍返回脚手架假 token。
3. `packages/editor/src/document-editor.tsx` 仍基于 `initialContent` 创建单机 BlockNote 编辑器。
4. 文档 15 / 16 已经提供协同领域的架构与协议口径，但相关 TypeScript 协议代码尚未沉淀到 `packages/contracts`。

当前阶段的约束也很明确：

1. M3 需要建立两个浏览器协同编辑同一文档的最小闭环。
2. 当前不引入 JWT，不把 token 标准化平台提前带进来。
3. 当前不做持久化、稳定快照、索引、评论或复杂 presence 扩展。
4. `workspaceId` 与 `documentId` 必须遵循仓库当前字符串 ID 事实，`user.id` 保持 `number`。

## Goals

1. 建立一条清晰、轻量、可验证的协同准入链路：`apps/api -> collab token -> apps/collab verify -> apps/web connect`。
2. 为 `apps/api`、`apps/collab`、`apps/web` 提供统一的协同协议真相源。
3. 让 `packages/editor` 能从单机模式平滑扩展为协同模式，而不重造编辑器绑定层。
4. 在不引入后续阶段复杂度的前提下，打通最小可运行协同服务。

## Decisions

### Decision: Shared Collaboration Protocol Lives In `packages/contracts`

**Choice**

将协同领域的共享类型、连接状态和房间命名函数统一放在 `packages/contracts/src/collaboration.ts`，并从 `@docweave/contracts` 导出。

**Rationale**

1. 当前仓库已有 `document`、`space`、`auth` DTO 的共享 contract 事实，协同协议继续放在同一包中最自然。
2. `contracts` 适合承载“共同语言”，不适合承载运行时代码；这与协同 token 的签发 / 验签逻辑边界一致。
3. 这样可以避免 `apps/api`、`apps/collab`、`apps/web` 各自复制 `roomName`、`capabilities`、presence 字段定义。

**Alternatives Considered**

1. 放到 `packages/collaboration`
   - 放弃原因：当前阶段只需要共享协议，不需要提前抽出一整套共享运行时层。
2. 分散定义到各 app
   - 放弃原因：最容易导致协议漂移，和文档 15 的目标相反。

### Decision: M3 Uses A Short-Lived HMAC Token Instead Of JWT

**Choice**

M3 协同 token 采用自定义 HMAC 签名短期 token，由 `apps/api` 签发、`apps/collab` 本地验签，不引入 JWT 依赖。

**Rationale**

1. 当前阶段只需要一张“可本地验签、绑定房间、短期有效”的协同连接票据。
2. `apps/collab` 需要的是无需查库即可校验的准入能力，而不是 JWT 生态能力。
3. 直接使用 Node 内置加密能力即可满足需求，能少装依赖、少带术语、少带后续兼容包袱。

**Alternatives Considered**

1. JWT `HS256 + jsonwebtoken`
   - 放弃原因：可以工作，但对第一阶段来说偏重，且当前没有必须依赖 JWT claims 的场景。
2. 直接复用 Adonis access token
   - 放弃原因：access token 是 API guard 的身份票据，不适合作为 collab runtime 的离线验签房间票据。

### Decision: `apps/collab` Is A Minimal Hocuspocus Service In M3

**Choice**

`apps/collab` 在 M3 只实现最小 Node + TypeScript 协同服务：启动 `Hocuspocus`、验 token、校验房间、加载内存 `Y.Doc`，并仅保留后续持久化 hook 接入点。

**Rationale**

1. 这正好覆盖 M3 的验收目标：可连接、可协同、可展示 presence。
2. 当前还不到持久化、恢复和快照链路落地的阶段，先把协同运行时单独跑通更值。
3. 通过只保留 `onLoadDocument` / `onStoreDocument` 这类 hook 接入点，而不在本 change 落地持久化，可以让后续演进不推翻本次结构。

**Alternatives Considered**

1. 把 WebSocket 直接塞进 `apps/api`
   - 放弃原因：违背现有架构文档，也会混淆实时连接生命周期与普通 HTTP 业务边界。
2. 现在就接真实持久化
   - 放弃原因：会把 M3 变成 M4 的一部分，范围膨胀。

### Decision: BlockNote Collaboration Uses `withCollaboration(...)` As The Primary Path

**Choice**

文档页和 `packages/editor` 采用 BlockNote 官方 `withCollaboration(...)` 路线接入 Yjs 协同，而不是自造编辑器绑定层。

**Rationale**

1. 官方已经提供支持路径，当前不需要再发明一层编辑器抽象。
2. 这允许编辑器保持“单机 / 协同”双模式，而不是复制两套编辑器组件。
3. 能把复杂度集中在 provider 初始化和上下文接线，而不是重新实现 BlockNote 内部绑定。

**Alternatives Considered**

1. 自写 editor binding
   - 放弃原因：风险高、收益低、维护成本大。
2. 继续沿用纯 `initialContent`
   - 放弃原因：无法满足 M3 的实时协同目标。

### Decision: Collaboration State Becomes The Primary M3 Body Truth

**Choice**

在协同初始化成功后，Yjs 协同状态成为 M3 阶段的正文主路径；REST 内容只保留为初始化兜底或失败 fallback，不与协同状态长期双写并存。

**Rationale**

1. M3 最大的实现风险不是“连不上”，而是“双正文真相竞争”。
2. 一旦 REST 内容和 Yjs 内容都被当作长生命周期可写真相，后续保存、回显和 presence 语义都会混乱。
3. 将 REST 内容明确降级为“初始化或失败兜底”可以保持阶段目标清晰。

**Alternatives Considered**

1. 同时保留 REST 编辑主路径和协同主路径
   - 放弃原因：高概率制造语义冲突，是最不 lazy 的实现。

## Risks And Trade-Offs

1. **自定义 HMAC token 不是行业标准格式**
   - 取舍：牺牲标准化换取当前阶段更少依赖和更小实现面。
   - 缓解：payload 结构和 `version` 保持清晰，后续仍可平滑迁移为 JWT。

2. **M3 先不做持久化，协同运行态仍是临时态**
   - 取舍：先打通协同连接和编辑闭环，把 M4 的工作留在后续阶段。
   - 缓解：`apps/collab` 从第一天起就保留 `onLoadDocument` / `onStoreDocument` 这类 hook 接入点，但不把它们当作 M3 的实现重点。
   - 后续记录：当前通过“空房间首帧 seed + 手动保存快照”保证可用性；真正的协同恢复与自动持久化应在后续独立 change：feat-m4-collaboration-persistence-baseline 中完成，而不是继续扩写本 change。

3. **本地 fallback 可能掩盖协同启动问题**
   - 取舍：用户体验上需要有失败兜底，但不能让兜底掩盖真实问题。
   - 缓解：把 fallback 视为降级态，并保留明确连接状态与错误展示。

4. **只读协同与可编辑协同的差异会增加前端分支**
   - 取舍：必须接受，因为文档 14 / 16 已明确只读与可编辑状态要分开。
   - 缓解：统一由可信 `capabilities` 驱动，避免页面自发猜权限。
