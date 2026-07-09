# 变更提案

## Why

当前仓库已经具备 M2 的最小产品链路：登录、工作台、空间详情、文档读取与单人编辑保存都已可用，但 M3 定义的“两个浏览器协同编辑同一文档”仍未真正落地。

现状里最关键的断点有四个：

1. `apps/collab` 仍是空壳，尚未提供 `Hocuspocus + Yjs` 的协同服务进程。
2. `POST /api/collaboration/token` 仍返回脚手架假 token，且当前未挂认证边界。
3. `packages/editor` 仍是纯 `initialContent` 单机编辑器模式，没有 `withCollaboration(...)` 协同接入。
4. 协同领域的共享协议还没有代码真相源，`packages/contracts/src/collaboration.ts` 尚未建立。

如果继续直接推进协同代码而不先收口这些基线，后续很容易出现 token 语义漂移、房间命名不一致、正文双真相竞争和前后端各写一套 presence 结构的问题。现在需要先把 M3 最小协同闭环的共同语言、准入链路和最小工程壳层稳定下来。

## What Changes

- 新增协同领域共享协议文件 `packages/contracts/src/collaboration.ts`，将文档 15 / 16 中约定的房间命名、token payload、capabilities、presence 与连接状态沉淀为 TypeScript 代码。
- 将 `apps/api` 的协同 token 接口从假实现改为真实的短期 HMAC 协同 token 签发，并补齐认证门槛。
- 新建最小 `apps/collab` Node + TypeScript 服务，使用 `Hocuspocus` 负责房间连接、token 校验、Yjs 文档加载和后续持久化钩子预留。
- 将 `packages/editor` 和 `apps/web` 的文档编辑路径升级为可挂协同 provider 的模式，按 `metadata -> token -> provider -> editor` 的顺序初始化，并在 provider 建立后附加 awareness 能力。
- 保持第一阶段范围克制：M3 只做“协同可连通、可编辑、可展示在线成员”，不在本次变更中补真实持久化和快照链路。

## Capabilities

### 新增能力

- collaboration-shared-contract-baseline
- collaboration-token-sign-verify-baseline
- hocuspocus-collab-runtime-baseline
- blocknote-yjs-collaboration-baseline

### 修改能力

- single-user-document-editor-baseline
- api-metadata-route-baseline

## Scope

### In Scope

- `packages/contracts/src/collaboration.ts` 中的共享协议与房间命名函数
- `apps/api` 的协同 token 签发、认证边界和能力字段计算
- `apps/collab` 的最小服务壳、房间准入和内存 `Y.Doc` 加载
- `packages/editor` 的协同模式接入能力
- `apps/web` 文档页的协同初始化顺序、token 获取、provider 挂载和本地兜底路径
- `docs/architecture/16. 协同 Token 与 Presence 设计.md` 的 ID 类型口径修正

### Out of Scope

- 不引入 JWT / `jsonwebtoken`
- 不做协同运行态持久化
- 不做稳定快照、索引、RAG 或导出链路
- 不做评论、批注、任务等二级实时对象
- 不做多节点扩展、Redis pub/sub 或更复杂的连接恢复策略

## Impact

- 影响的代码区域：`packages/contracts`、`packages/editor`、`apps/api`、`apps/collab`、`apps/web`
- 影响的 API 或接口：`POST /api/collaboration/token`、文档页编辑初始化链路、协同房间命名与 token payload
- 影响的用户路径：从“单人本地编辑”升级为“打开文档页后可进入受控协同编辑房间”
