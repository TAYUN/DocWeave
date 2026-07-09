# 执行合同

## Intent Lock

- **变更名称**：`feat-m3-collaboration-baseline`
- **要解决的问题**：
  - DocWeave 已经具备 M2 的登录、工作台、文档读取与单人编辑基线，但 M3 要求的“两个浏览器协同编辑同一文档”还没有真正形成闭环。
  - 当前缺口集中在四处：`packages/contracts` 没有协同共同真相源，`apps/api` 仍返回假 token，`apps/collab` 还没有最小 Hocuspocus runtime，`apps/web` / `packages/editor` 仍停留在单机 `initialContent` 路径。
  - 如果不先锁定共同协议、准入链路和协同正文主路径，后续很容易出现房间命名漂移、token 语义分叉和 REST/Yjs 双正文真相冲突。
- **范围内**：
  - 建立 `packages/contracts/src/collaboration.ts` 作为协同共享协议真相源。
  - 将 `POST /api/collaboration/token` 升级为认证边界内的真实 HMAC 短期 token 签发接口。
  - 新建 `apps/collab` 最小 Hocuspocus 服务壳，完成本地验签、房间校验和内存 `Y.Doc` 加载。
  - 将 `packages/editor` 与 `apps/web` 升级为 `metadata -> token -> provider -> editor` 的协同初始化主路径，并在 provider 建立后附加 awareness。
  - 以 Yjs 协同状态作为 M3 正文主路径，本地 snapshot 只保留为失败降级；空房间允许用当前 REST 快照做一次首帧 seed，避免协同接管后正文空白。
- **范围外**：
  - 不引入 JWT / `jsonwebtoken`。
  - 不实现协同持久化、稳定快照、索引、RAG、导出或评论等二级实时对象。
  - 不做多节点扩展、Redis pub/sub、复杂恢复策略或正式权限平台化。

## Approved Behavior

- **已批准需求摘要**：
  - `@docweave/contracts` 必须统一导出协同房间命名、token payload、capabilities、awareness、presence 与连接状态。
  - `apps/api` 必须为已认证且有访问权限的用户签发短期协同 token，返回 `documentId`、`roomName`、`token`、`provider`、`expiresInSeconds`。
  - `apps/collab` 必须只依赖共享 secret 在本地完成 token 验签，并拒绝过期、坏签名或跨房间重放的连接。
  - 文档页必须按 `metadata -> token -> provider -> editor` 顺序建立协同路径，awareness 作为 provider 建立后的附加能力。
  - BlockNote 协同必须走官方 `withCollaboration(...)`，并让 Yjs 成为成功初始化后的正文主路径。
  - 只读与可编辑协同必须由可信 `capabilities` 驱动，presence / awareness 结构必须来自共享 contract。
- **关键场景**：
  - 已认证用户请求 `POST /api/collaboration/token` 时，获得绑定单一房间、短期有效的真实 token。
  - `apps/collab` 收到合法 token 且 `roomName === documentName` 时允许接入，否则拒绝。
  - 文档页成功建立 provider 后，用 `withCollaboration(...)` 创建协同编辑器并展示最小在线成员状态。
  - 协同房间首次为空且文档已有稳定正文时，页面会把当前快照 seed 进协同 fragment，再切换到协同编辑器。
  - 协同建立失败或超时时，页面只进入本地 snapshot 降级态，而不是维持双正文真相。
- **验收检查**：
  - `pnpm typecheck:api`
  - `pnpm typecheck:web`
  - `pnpm --dir apps/collab exec tsc --noEmit`
  - `pnpm build:web`
  - `pnpm check:workspace`
  - 两个浏览器窗口连入同一文档时，正文可同步、在线成员可见。

## Design Constraints

- **架构约束**：
  - `packages/contracts/src/collaboration.ts` 是协同协议共同真相源，房间命名/解析不再在 `apps/collab` 单独包装一层。
  - `apps/collab` 只做最小 Hocuspocus runtime，不混入业务数据库判权，也不和 `apps/api` 混成同一个 HTTP/WebSocket 进程。
  - `packages/editor` 和 `apps/web` 两侧都可以改，但不能各自维护一套独立协同状态。
- **接口约束**：
  - `workspaceId` / `documentId` 必须保持 `string`，`user.id` 必须保持 `number`。
  - 房间名必须遵循 `workspace:{workspaceId}:document:{documentId}`。
  - token payload 必须包含 `version`、`workspaceId`、`documentId`、`roomName`、`capabilities`、`user`、`issuedAt`、`expiresAt`。
  - awareness 只要求 M3 最小字段：`user` 与 `canEdit`；不要求 cursor / selection telemetry。
- **依赖约束**：
  - token 签发与验签优先使用 Node 内置加密能力，不为 M3 新增 JWT 依赖。
  - BlockNote 协同走官方支持路径，不自造 editor binding 层。
- **数据约束**：
  - 协同成功后，Yjs 是唯一正文主路径；REST 内容只承担初始化兜底或失败 fallback。
  - `onLoadDocument` / `onStoreDocument` 只保留 hook 接入点，不在本 change 落地持久化；当前恢复能力只覆盖前端空房间 seed，不替代后续服务端协同恢复方案。

## Requirement Coverage

| Requirement | Batch | Test Obligation |
|---|---|---|
| Shared Collaboration Contracts | Batch 1 | `packages/contracts` 导出可被 api/collab/web 同时消费；类型检查通过 |
| Room Naming Must Be Shared And Parseable | Batch 1, Batch 2 | 生成格式必须是 `workspace:{workspaceId}:document:{documentId}`；非法房间名解析失败 |
| Collaboration Token Payload Must Match Current ID Semantics | Batch 1 | `workspaceId/documentId` 为 `string`，`user.id` 为 `number` |
| Shared Presence And Connection State Contracts | Batch 1, Batch 3 | awareness/presence/connection status 来自共享 contract；页面层不散写字段 |
| API Must Sign Short-Lived Collaboration Tokens | Batch 1 | 已认证请求返回真实 token 响应；匿名请求被拒绝 |
| Collaboration Tokens Must Use Shared Payload Semantics | Batch 1 | token payload 字段完整且与共享 contract 对齐 |
| Collab Runtime Must Verify Tokens Without Business Re-Authorization | Batch 2 | 合法 token 可接入；过期/坏签名/跨房间重放被拒绝 |
| M3 Token Implementation Must Avoid JWT Dependency | Batch 1, Batch 2 | 实现不引入 JWT-specific runtime dependency |
| Document Page Must Initialize Collaboration In A Stable Order | Batch 3 | 初始化顺序为 `metadata -> token -> provider -> editor`，awareness 后挂 |
| BlockNote Must Use Official Collaboration Binding | Batch 3 | 使用 `withCollaboration(...)` 创建协同编辑器 |
| Collaboration Must Be The Primary M3 Document Body Path | Batch 3 | 成功协同时 Yjs 为主路径；失败时仅降级到本地 snapshot |
| Empty Collaboration Rooms Must Not Blank Existing Content | Batch 3, Batch 4 | 空房间接管时使用现有快照做一次 seed，避免正文先显示后空白 |
| Read Access And Edit Access Must Follow Collaboration Capabilities | Batch 1, Batch 3 | `capabilities` 决定只读/可编辑协同行为 |
| M3 Must Expose Minimum Presence Visibility | Batch 3, Batch 4 | 两端在线成员可见，结构来自共享 awareness/presence contract |

## Task Batches

### Batch 1

- **目标**：锁定共享协议与 API 协同准入基线。
- **输入**：当前字符串 ID 语义、现有 auth 用户上下文、planning 中批准的 token 与 room 约束。
- **输出**：`packages/contracts/src/collaboration.ts`、`POST /api/collaboration/token` 真实返回、`COLLAB_SECRET` 环境约束。
- **完成标准**：
  - `pnpm typecheck:api` 通过。
  - `pnpm typecheck:web` 通过。
  - token payload、房间 helper、presence/awareness/connection status 都从 `@docweave/contracts` 导出。
  - `/api/collaboration/token` 不再匿名可调。

### Batch 2

- **目标**：建立 `apps/collab` 最小 Hocuspocus 服务壳。
- **输入**：Batch 1 的共享 contract 与 token 语义。
- **输出**：最小可启动协同服务、`onAuthenticate` 上下文、内存 `Y.Doc` 加载能力。
- **完成标准**：
  - `pnpm --dir apps/collab exec tsc --noEmit` 通过。
  - 最小启动检查通过。
  - 连接准入只依赖本地验签和共享房间 helper，不引入业务数据库判权。
  - 只保留 `onLoadDocument` / `onStoreDocument` hook 接入点，不落地持久化。

### Batch 3

- **目标**：接通 BlockNote + Yjs + 文档页协同主路径。
- **输入**：Batch 2 的运行时能力、共享 `capabilities` / awareness contract、当前单机编辑器页面。
- **输出**：`packages/editor` 协同模式、文档页 token 获取与 provider 初始化、协同失败降级态。
- **完成标准**：
  - `pnpm typecheck:web` 通过。
  - `pnpm build:web` 通过。
  - 页面按 `metadata -> token -> provider -> editor` 顺序初始化。
  - `withCollaboration(...)` 成为协同编辑主路径。
  - REST 内容不再作为成功协同后的竞争性可写真相。
  - 空协同房间不会把已有正文接管成空白。

### Batch 4

- **目标**：完成最小双窗口联通验证。
- **输入**：前三批产物、登录态、真实文档页。
- **输出**：M3 最小协同闭环验证结果。
- **完成标准**：
  - 两个浏览器窗口进入同一房间。
  - 正文变更可双向同步。
  - 在线成员可见。
  - `pnpm check:workspace` 通过。

## Test Obligations

- **必须先从失败检查开始的行为**：
  - 当前若没有共享协同 contract 入口，应视为协同共同语言未落地。
  - 当前若 `/api/collaboration/token` 仍返回脚手架假 token，应视为协同准入未落地。
  - 当前若 `apps/collab` 无法最小启动，应视为协同运行时未落地。
  - 当前若文档页仍只支持 `initialContent` 单机模式，应视为协同编辑路径未落地。
- **必需的边界情况**：
  - 匿名请求拿不到协同 token。
  - 过期 token、坏签名 token、跨房间重放 token 都必须被拒绝。
  - 非法房间名解析必须失败，不能猜测标识。
  - 只读协同不会启用可编辑正文变更。
  - 协同失败时只能降级，不得和 Yjs 长期双写并存。
- **回归敏感区域**：
  - `packages/contracts/`
  - `apps/api/start/env.ts`
  - `apps/api/start/routes.ts`
  - `apps/api/app/controllers/collaboration_tokens_controller.ts`
  - `apps/api/app/services/collaboration_token_service.ts`
  - `apps/collab/`
  - `packages/editor/src/document-editor.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/pages/documents/document-editor-page.tsx`

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这条 change 天然分成协议/API、collab runtime、前端接线、双窗口验证四批，依赖关系清晰。
  - 每一批都能用类型检查、最小启动检查或真实联通验证收口，没必要引入更重的执行编排。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 待确认共享 contract、token 准入、collab runtime、web/editor 接线、双窗口验证都已落地 |
| Correctness | Pending | 待确认 token 语义、房间命名、初始化顺序、只读/可编辑能力和双正文约束完全对齐 planning |
| Coherence | Pending | 待确认 api、collab、web、editor 四侧对协同协议和正文主路径使用同一口径 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 后审查共享 contract 和 token payload 是否仍然单一真相源。
  - Batch 2 后审查 `apps/collab` 是否仍保持最小 runtime，而没有滑向持久化或数据库判权。
  - Batch 3 后审查页面是否真正以 Yjs 为主正文路径，并只在失败时降级。
  - Batch 4 后审查双窗口联通结果是否真实成立，而不是只通过类型检查自证。
- **阻塞类别**：
  - 实现试图引入 JWT、持久化、快照、Redis、多节点或评论等超范围能力。
  - 页面或服务端出现第二套房间命名、presence 结构或 token payload 定义。
  - 协同成功后仍保留 REST 正文与 Yjs 正文长期双写。

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果要把协同持久化、快照恢复、Redis pub/sub、多节点扩展或评论等能力并入本 change。
  - 如果 `packages/editor` 与 `apps/web` 的责任边界需要重新定义，超出当前 planning 已批准范围。
- **何时回退到 `bridging`**：
  - 如果 `proposal.md`、`specs/`、`design.md`、`tasks.md` 任何一处发生实质性变更，导致当前合同不再准确。
  - 如果发现有 requirement 无法落入现有 batch 或 test obligation，需要重排执行批次。
- **何时不得继续实现**：
  - 用户未明确批准本执行合同。
  - 共享 contract、token 语义、初始化顺序或正文主路径仍存在未决歧义。
  - 实现开始超出“最小协同闭环”的范围。
