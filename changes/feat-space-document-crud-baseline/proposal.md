# 变更提案

## 背景（Why）

`feat-web-api-postgres-foundation` 已经把 `apps/web`、`apps/api` 与 PostgreSQL 元数据基线联通起来，当前前端可以读取真实的 `spaces` 与 `documents` 数据，后端也具备对应的读接口、迁移和 seed。

但这仍然停留在“只读工作台骨架”阶段。用户还不能在页面里创建空间、创建文档或编辑文档摘要，因此项目虽然已经有了基础元数据链路，却还没有形成第一条真正可交互的闭环。

现在需要继续往前推进到一个更有验收价值的阶段：让 `apps/web` 驱动真实写入流程，倒逼 `apps/api` 提供最小的创建/编辑接口，并让 PostgreSQL 中的数据随页面操作发生变化。这样才能把当前阶段从“能看数据”推进到“能操作数据”。

## 变更内容（What Changes）

- 为 `apps/api` 新增 `spaces`、`documents` 的最小写接口。
- 为 `apps/web` 新增创建 space、创建 document、编辑 document summary 的表单流程。
- 为前后端交互补最小成功/失败反馈。
- 为当前元数据写链路补最小回归验证。

## 能力（Capabilities）

### 新增能力

- metadata-write-api-baseline
- metadata-write-ui-flow
- document-summary-edit-baseline

### 修改能力

- web-workspace-shell
- api-metadata-route-baseline
- postgres-metadata-baseline

## 范围（Scope）

### 范围内（In Scope）

- `POST /api/spaces`
- `POST /api/documents`
- `PATCH /api/documents/:documentId` 的真实编辑语义
- `apps/web` 中创建 space、创建 document、编辑 document summary 的表单
- 页面级成功/失败提示与最小刷新逻辑

### 范围外（Out of Scope）

- 不实现正式登录、权限隔离或空间级访问控制
- 不接入 BlockNote 正文编辑器
- 不实现删除 space/document、复杂树拖拽、搜索、协同或 AI 写入
- 不引入新的后台任务、Redis 队列或 Qdrant 检索逻辑

## 影响（Impact）

- 影响的代码区域：`apps/web`、`apps/api`、数据库元数据模型与测试验证脚本
- 影响的 API 或接口：新增 `spaces/documents` 的写接口与对应前端 mutation 流程
- 依赖或涉及的外部系统：PostgreSQL
