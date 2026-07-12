# 实现任务

## 文件结构

- `Modify: packages/contracts/src/collaboration.ts` — 补充内部协同运行态读取/回写 contract
- `Modify: packages/contracts/src/index.ts` — 暴露新增协同内部 contract
- `Modify: packages/adapters/src/document.ts` — 补最小服务端正文转换 helper
- `Modify: packages/adapters/src/index.ts` — 暴露协同正文转换 helper
- `Modify: apps/api/start/routes.ts` — 增加内部协同运行态读取/回写路由
- `Create: apps/api/app/controllers/internal_collaboration_runtime_controller.ts` — 承接 collab 内部正文读取与回写
- `Create: apps/api/app/services/collaboration_runtime_service.ts` — 收口运行态正文读取/回写规则
- `Create: apps/api/app/middleware/collaboration_internal_auth_middleware.ts` — 校验 collab 内部调用 secret
- `Modify: apps/api/start/kernel.ts` — 注册内部协同 middleware
- `Create: apps/api/tests/functional/collaboration_runtime_flow.spec.ts` — 覆盖运行态读取/回写和边界语义
- `Modify: apps/collab/src/config.ts` — 增加 API 地址与内部 secret 配置
- `Create: apps/collab/src/runtime_client.ts` — 调用 API 内部正文读取/回写端点
- `Modify: apps/collab/src/server.ts` — 落地 `onLoadDocument` / `onStoreDocument` 恢复与自动持久化
- `Modify: apps/web/src/pages/documents/document-editor-page.tsx` — 把 seed 明确收口为兜底而非主真相

## Interfaces

### Internal Contracts

- **Produces**: `CollaborationRuntimeDocumentDto`
  - `{ documentId: string; content: string; updatedAt: string | null }`
- **Consumes**: `UpdateCollaborationRuntimeInput`
  - `{ content: string }`

### Collab → API

- **Consumes**: `GET /api/internal/collaboration/documents/:documentId/runtime`
  - 输出：`{ data: CollaborationRuntimeDocumentDto }`
- **Consumes**: `PUT /api/internal/collaboration/documents/:documentId/runtime`
  - 输入：`UpdateCollaborationRuntimeInput`
  - 输出：`{ data: CollaborationRuntimeDocumentDto }`

### Server Conversion

- **Consumes**: `restoreYDocFromSerializedContent(input: { content: string; fragmentName: string }): Y.Doc`
- **Consumes**: `serializeYDocContent(input: { document: Y.Doc; fragmentName: string }): string`

## 1. Batch 1: 内部 contract 与 API 持久化承接点

- **Depends on**: Batch 0
- **Files**: `packages/contracts/src/collaboration.ts`, `packages/contracts/src/index.ts`, `apps/api/start/routes.ts`, `apps/api/app/controllers/internal_collaboration_runtime_controller.ts`, `apps/api/app/services/collaboration_runtime_service.ts`, `apps/api/app/middleware/collaboration_internal_auth_middleware.ts`, `apps/api/start/kernel.ts`, `apps/api/tests/functional/collaboration_runtime_flow.spec.ts`
- **Interfaces**:
  - Consumes：现有 `documents.content`、`DocumentDetailDto`
  - Produces：内部运行态正文读取/回写 API
- [x] **1.1 编写失败检查**
  - 先写功能测试，断言当前仓库尚不存在内部协同运行态读取/回写端点。
- [x] **1.2 运行检查并确认失败**
  - Run:
    - `pnpm --dir apps/api test --files tests/functional/collaboration_runtime_flow.spec.ts`
  - Expected: FAIL
- [x] **1.3 实现最小化代码**
  - 在 `apps/api` 中新增内部协同读取/回写 controller 与 service
  - 复用 Lucid 与现有文档模型，只更新 `documents.content`
  - 用最小内部 secret middleware 守住 route，不引入新认证系统
- [x] **1.4 运行检查并确认通过**
  - Run:
    - `pnpm --dir apps/api test --files tests/functional/collaboration_runtime_flow.spec.ts`
    - `pnpm typecheck:api`
  - Expected: PASS
- [x] **1.5 收口检查**
  - 确认内部回写不会创建 `document_snapshots`
  - 确认内部回写不会前移 `latestSnapshotVersion`
  - 确认内部回写失败不会污染 snapshot/index 语义

## 2. Batch 2: 适配层服务端正文转换 helper

- **Depends on**: Batch 1
- **Files**: `packages/adapters/src/document.ts`, `packages/adapters/src/index.ts`
- **Interfaces**:
  - Consumes：现有 `parseDocumentContent`、`serializeDocumentContent`
  - Produces：服务端 `content <-> Y.Doc` 转换 helper
- [x] **2.1 编写失败检查**
  - 先补一个最小断言或小型测试，证明当前适配层还没有服务端 `Y.Doc` 转换 helper。
- [x] **2.2 运行检查并确认失败**
  - Run:
    - `pnpm typecheck:api`
    - `pnpm --dir apps/collab exec tsc --noEmit`
  - Expected: FAIL
- [x] **2.3 实现最小化代码**
  - 在 `packages/adapters` 中新增服务端正文字符串与 `Y.Doc` 的转换 helper
  - 复用现有内容 parse/serialize 规则，不新发明第二套正文格式
- [x] **2.4 运行检查并确认通过**
  - Run:
    - `pnpm typecheck:api`
    - `pnpm --dir apps/collab exec tsc --noEmit`
  - Expected: PASS
- [x] **2.5 轻量复核**
  - 确认第三方转换细节没有散落进 `apps/collab`
  - 确认 helper 输出仍然围绕现有 BlockNote JSON contract

## 3. Batch 3: `apps/collab` 恢复与自动持久化接线

- **Depends on**: Batch 2
- **Files**: `apps/collab/src/config.ts`, `apps/collab/src/runtime_client.ts`, `apps/collab/src/server.ts`
- **Interfaces**:
  - Consumes：内部协同运行态 API、适配层 `Y.Doc` 转换 helper
  - Produces：`onLoadDocument` 恢复、`onStoreDocument` 自动持久化
- [x] **3.1 编写失败检查**
  - 先写最小检查，证明当前 `onLoadDocument` 仍只返回空内存文档、`onStoreDocument` 仍未持久化。
- [x] **3.2 运行检查并确认失败**
  - Run:
    - `pnpm --dir apps/collab exec tsc --noEmit`
  - Expected: FAIL
- [x] **3.3 实现最小化代码**
  - `onLoadDocument`：优先复用内存 `Y.Doc`，缺失时调用 API 读取 `documents.content` 并恢复
  - `onStoreDocument`：调用 API 内部回写正文，只更新 `documents.content`
  - 保持自动持久化不创建 snapshot、不触发 index
- [x] **3.4 运行检查并确认通过**
  - Run:
    - `pnpm --dir apps/collab exec tsc --noEmit`
    - `pnpm typecheck:api`
  - Expected: PASS
- [x] **3.5 收口检查**
  - 确认重连后房间仍绑定正确 `documentId`
  - 确认服务端恢复不再依赖浏览器首帧 seed 才有内容
  - 确认自动持久化不写 snapshot/index 表

## 4. Batch 4: 前端兜底收口与最小回归

- **Depends on**: Batch 3
- **Files**: `apps/web/src/pages/documents/document-editor-page.tsx`, `docs/planning/40. 协同回归清单与交接文档.md`
- **Interfaces**:
  - Consumes：现有文档页协同初始化与本地降级逻辑
  - Produces：seed 退位为兜底、最小回归口径
- [x] **4.1 编写失败检查**
  - 先做手工回归清单或必要时最小前端断言，确认当前行为仍以 seed 为主。
- [x] **4.2 实现最小化代码**
  - 只保留 seed 作为服务端恢复为空或协同失败时的兜底
  - 不重做现有保存按钮交互
  - 如有必要，补充回归清单中的恢复/重连观察项
- [x] **4.3 运行检查并确认通过**
  - Run:
    - `pnpm typecheck:web`
    - `pnpm build:web`
  - Expected: PASS
- [x] **4.4 手工回归**
  - 两个浏览器打开同一已有正文文档，确认服务端恢复后仍能同步
  - 刷新页面后正文不依赖首帧 seed 才出现
  - 网络短断后重连，正文不回滚到旧 seed
- [x] **4.5 收口确认**
  - 确认“自动持久化更新 `documents.content`，显式 snapshot/index 继续独立”已被实现口径和回归口径共同覆盖
