# 变更提案

## 背景（Why）

在 `chore-monorepo-bootstrap` 完成 Monorepo 根壳之后，项目已经继续落地了 `apps/web`、`apps/api` 与 PostgreSQL 元数据基线的第一批真实实现，包括前端路由与查询骨架、后端 API 模块骨架、数据库模型/迁移/seed 以及本地 API 联调入口。

这些实现方向与既有的技术决策和第一阶段路线一致，但它们没有被单独纳入新的 `spec-superflow` change，因此当前代码状态与工作流工件之间存在缺口：代码已经前进到了 M1/M2 之间的“前后端元数据骨架”阶段，而 change 工件仍停留在“Monorepo 外壳初始化”。

现在需要创建一条新的 change，把已经落地的 `web/api/postgres` 基线正式纳入工作流，避免后续继续在未映射 change 上迭代，导致范围、验收和回归口径失真。

## 变更内容（What Changes）

- 将 `apps/web` 的 Vite + React SPA 基线扩展为 `TanStack Router + TanStack Query` 驱动的工作台骨架。
- 将 `apps/api` 的 AdonisJS v7 基线扩展为面向 `auth / spaces / documents / collaboration / ai / rag` 的 phase-1 路由骨架。
- 将主业务元数据的最小数据库基线切换到 PostgreSQL，并为 `spaces`、`documents` 提供模型、迁移与初始 seed。
- 为本地联调补齐 API 代理、环境变量模板和 seed 数据，使前端可以读取真实 API 返回而不是本地假数据。

## 能力（Capabilities）

### 新增能力

- web-workspace-shell
- api-metadata-route-baseline
- postgres-metadata-baseline
- local-metadata-seed-baseline

### 修改能力

- monorepo-workspace-shell
- multi-app-directory-baseline

## 范围（Scope）

### 范围内（In Scope）

- `apps/web` 中基于 `TanStack Router + TanStack Query` 的概览页、space 页和 document 详情页骨架。
- `apps/web` 中真实调用 `/api/spaces`、`/api/documents`、`/api/documents/:documentId` 的 API 数据访问层。
- `apps/api` 中 phase-1 规划内的基础路由集合与占位 controller。
- `apps/api` 中 PostgreSQL 连接配置、`spaces`/`documents` 模型、迁移和 baseline seeder。
- 本地联调所需的 `DB_*`、`REDIS_*`、`QDRANT_*` 环境变量模板补充。

### 范围外（Out of Scope）

- 不实现完整登录流程、密码校验和正式权限体系。
- 不接入 BlockNote 单人编辑器、Yjs 协同、Hocuspocus 服务或 worker 任务执行。
- 不接通 Redis、Qdrant、MinIO 的真实业务读写，只保留本地配置占位。
- 不实现 `POST /api/rag/chat` 的流式响应、真实检索或模型调用。
- 不实现生产级部署编排、Observability 或 CI/CD 流程。

## 影响（Impact）

- 影响的代码区域：`apps/web`、`apps/api`、`pnpm-lock.yaml` 以及相关环境变量模板。
- 影响的 API 或接口：新增并稳定本地 phase-1 元数据 API 路径与响应骨架。
- 依赖或涉及的外部系统：PostgreSQL、Vite dev proxy、本地 Redis/Qdrant 配置占位。
