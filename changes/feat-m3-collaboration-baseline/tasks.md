# 实现任务

## 文件结构

- `Modify: docs/architecture/16. 协同 Token 与 Presence 设计.md` — 修正 `workspaceId` / `documentId` 类型口径为 `string`
- `Create: packages/contracts/src/collaboration.ts` — 落地协同领域共享类型、枚举和房间命名函数
- `Modify: packages/contracts/src/index.ts` — 暴露协同共享协议入口
- `Modify: apps/api/start/env.ts` — 增加 `COLLAB_SECRET` 等协同服务环境变量校验
- `Modify: apps/api/start/routes.ts` — 将 `/api/collaboration/token` 挂到认证边界内
- `Create: apps/api/app/services/collaboration_token_service.ts` — 签发短期 HMAC 协同 token
- `Modify: apps/api/app/controllers/collaboration_tokens_controller.ts` — 从假 token 切到真实 token payload 与返回结构
- `Create: apps/collab/package.json` — 最小协同服务依赖与脚本
- `Create: apps/collab/tsconfig.json` — 协同服务 TypeScript 基线
- `Create: apps/collab/src/index.ts` — 启动入口
- `Create: apps/collab/src/config.ts` — 读取并校验协同服务运行时配置
- `Create: apps/collab/src/auth.ts` — 校验 HMAC token 并生成连接上下文
- `Create: apps/collab/src/server.ts` — 配置 `Hocuspocus` server hooks
- `Modify: packages/editor/package.json` — 增加协同编辑所需依赖
- `Modify: packages/editor/src/document-editor.tsx` — 支持 standalone / collaboration 两种编辑器模式
- `Modify: apps/web/package.json` — 增加前端协同 provider 依赖
- `Modify: apps/web/src/lib/api.ts` — 增加协同 token 获取接口
- `Modify: apps/web/src/pages/documents/document-editor-page.tsx` — 接入 token 查询、provider 初始化和本地兜底

## Interfaces

### Shared Contracts

- **Produces**: `CollaborationTokenPayload`
- **Produces**: `CollaborationCapabilities`
- **Produces**: `CollaborationAwarenessState`
- **Produces**: `CollaborationPresenceEntry`
- **Produces**: `CollaborationConnectionStatus`
- **Produces**: `buildDocumentRoomName(workspaceId: string, documentId: string): string`
- **Produces**: `parseDocumentRoomName(roomName: string): { workspaceId: string; documentId: string } | null`

### API → Web

- **Consumes**: `POST /api/collaboration/token`
  - 输入：`{ documentId: string }`
  - 输出：`{ data: { documentId: string; roomName: string; token: string; provider: 'apps/collab'; expiresInSeconds: number } }`

### API → Collab

- **Produces**: `signCollaborationToken(payload, secret): string`
- **Consumes**: 与 `packages/contracts/src/collaboration.ts` 一致的 token payload

### Web → Collab Runtime

- **Consumes**: `roomName`, `token`, `user`, `capabilities`
- **Produces**: `Y.Doc + HocuspocusProvider + BlockNote withCollaboration(...)`

## 1. Batch 1: 共享协议与 API 协同准入基线

- **Depends on**: Batch 0
- **Files**: `docs/architecture/16. 协同 Token 与 Presence 设计.md`, `packages/contracts/src/collaboration.ts`, `packages/contracts/src/index.ts`, `apps/api/start/env.ts`, `apps/api/start/routes.ts`, `apps/api/app/services/collaboration_token_service.ts`, `apps/api/app/controllers/collaboration_tokens_controller.ts`
- **Interfaces**:
  - Consumes：当前 `DocumentDetailDto` / `SpaceTreeDto` 的字符串 ID 语义、现有 `auth` 用户信息与文档访问上下文
  - Produces：共享协同 contract、真实 `POST /api/collaboration/token`、HMAC token 签发能力
- [x] **1.1 编写失败检查**
  - 先用类型检查或最小断言证明协同共享 contract 入口不存在，且 `/api/collaboration/token` 仍未返回真实 room/token payload。
- [x] **1.2 运行检查并确认失败**
  - Run: `pnpm typecheck:api`
  - Expected: 协同 contract / token service / env 校验尚不存在。
- [x] **1.3 实现最小化代码**
  - 创建 `packages/contracts/src/collaboration.ts`
  - 为 `apps/api` 增加 `COLLAB_SECRET`
  - 将 `/api/collaboration/token` 收口到认证边界
  - 使用 HMAC 短期 token 替换假 token
- [x] **1.4 运行检查并确认通过**
  - Run:
    - `pnpm typecheck:api`
    - `pnpm typecheck:web`
  - Expected: PASS
- [x] **1.5 轻量复核**
  - 确认 `workspaceId/documentId` 已统一为 `string`
  - 确认 token payload 与房间命名函数都从 `contracts` 导出
  - 确认 `/api/collaboration/token` 不再匿名可调

## 2. Batch 2: apps/collab 最小 Hocuspocus 服务壳

- **Depends on**: Batch 1
- **Files**: `apps/collab/package.json`, `apps/collab/tsconfig.json`, `apps/collab/src/index.ts`, `apps/collab/src/config.ts`, `apps/collab/src/auth.ts`, `apps/collab/src/server.ts`
- **Interfaces**:
  - Consumes：`CollaborationTokenPayload`, `buildDocumentRoomName`, `parseDocumentRoomName`
  - Produces：最小可启动协同服务、`onAuthenticate` 上下文、内存 `Y.Doc` 加载能力
- [x] **2.1 编写失败检查**
  - 先让 `apps/collab` 在缺少最小入口和配置文件时无法通过类型检查或启动检查。
- [x] **2.2 运行检查并确认失败**
  - Run: `pnpm --dir apps/collab exec tsc --noEmit`
  - Expected: 当前目录无协同服务代码，命令无法满足通过条件。
- [x] **2.3 实现最小化代码**
  - 建立 `Hocuspocus` 服务壳
  - 在 `onAuthenticate` 中复用 `packages/contracts/src/collaboration.ts` 的房间命名/解析 helper 做 token 验签、`roomName === documentName` 校验与上下文挂载
  - `onLoadDocument` 先返回内存 `Y.Doc`
  - 为后续 `onStoreDocument` / `onLoadDocument` 持久化扩展保留最小 hook 接入点，但不在本 change 落地
- [x] **2.4 运行检查并确认通过**
  - Run:
    - `pnpm --dir apps/collab exec tsc --noEmit`
    - `pnpm --dir apps/collab node ./src/index.ts`（或等价最小启动检查）
  - Expected: PASS
- [x] **2.5 收口检查**
  - 确认没有引入 JWT
  - 确认协同服务不直接依赖业务数据库判权
  - 确认持久化仍明确留在后续阶段

## 3. Batch 3: BlockNote + Yjs + Web 文档页接线

- **Depends on**: Batch 2
- **Files**: `packages/editor/package.json`, `packages/editor/src/document-editor.tsx`, `apps/web/package.json`, `apps/web/src/lib/api.ts`, `apps/web/src/pages/documents/document-editor-page.tsx`
- **Interfaces**:
  - Consumes：`POST /api/collaboration/token`、`CollaborationTokenPayload` 中的 `roomName/user/capabilities`
  - Produces：`metadata -> token -> provider -> editor` 初始化链路、协同失败 `2.5s` 本地兜底
- [x] **3.1 编写失败检查**
  - 先用类型检查或最小页面约束证明当前编辑器仍只支持 `initialContent` 单机模式，且没有协同 token 获取入口。
- [x] **3.2 运行检查并确认失败**
  - Run: `pnpm typecheck:web`
  - Expected: 当前还没有协同 provider / editor 模式切换能力。
- [x] **3.3 实现最小化代码**
  - 为 `DocumentEditor` 增加 standalone / collaboration 模式
  - 在文档页先取 metadata，再取 collab token，再建立 provider
  - 使用 `withCollaboration(...)` 作为主路径
  - 仅在协同启动失败时启用本地快照兜底，避免双正文真相并存
- [x] **3.4 运行检查并确认通过**
  - Run:
    - `pnpm typecheck:web`
    - `pnpm build:web`
  - Expected: PASS
- [x] **3.5 轻量复核**
  - 确认协同是主正文路径，REST 内容只承担初始化兜底
  - 确认可只读与可编辑能力由可信 `capabilities` 决定
  - 确认 presence / awareness 的结构来自共享 contract，而不是页面自定义散写

## 4. Batch 4: 最小联通验证

- **Depends on**: Batch 3
- **Files**: `apps/api`, `apps/collab`, `apps/web` 运行时验证记录（如需补充可回写到本 change 文档）
- **Interfaces**:
  - Consumes：登录态、真实文档页、协同 token、协同服务连接
  - Produces：M3 最小闭环的手动验证结果
- [x] **4.1 准备验证场景**
  - 使用同一文档、两个浏览器窗口、同一协同房间。
- [x] **4.2 运行联通验证**
  - 验证“拿 token -> 建立连接 -> 两端同步正文 -> 展示在线成员”主链路。
- [x] **4.3 记录失败与修正**
  - 若启动、验签或 provider 接线失败，先记录根因，再补最小修正。
- [x] **4.4 运行最终检查**
  - Run: `pnpm check:workspace`
  - Expected: PASS
- [x] **4.5 收口确认**
  - 确认 M3 范围仍停留在“最小协同闭环”，没有偷偷扩成持久化或快照系统
  - 记录后续事项：`onLoadDocument` / `onStoreDocument` 真实持久化后置到下一条独立 change：feat-m4-collaboration-persistence-baseline，当前只保留 hook 边界与前端空房间 seed 兜底
