# 技术设计

## 上下文

- 当前状态：
  - `chore-monorepo-bootstrap` 已完成 Monorepo 根壳、目录集合和本地基础设施入口的初始化。
  - `apps/web` 与 `apps/api` 已经进一步落地了真实脚手架和第一批业务无关的骨架实现，但这些实现尚未被新的 change 工件承接。
  - 项目路线图已经明确 M1 需要联通四端应用与基础依赖，M2 需要最小工作区、空间与文档元数据链路。
- 约束条件：
  - 必须遵守 `React SPA + Vite + TanStack Router + TanStack Query` 与 `AdonisJS v7` 的既有技术决策。
  - 必须使用 PostgreSQL 作为当前主业务元数据数据库基线，而不是继续停留在 starter 默认 SQLite。
  - 本 change 只固化元数据骨架，不延伸到 BlockNote 编辑、协同、worker、RAG 真正执行链路。
  - Redis、Qdrant、MinIO 在本 change 中仅保留环境变量和本地入口占位，不做真实业务接线。
- 利益相关者：
  - 前端实现工作台、空间树和文档页的开发者。
  - 后端负责主业务元数据 API、数据库与后续权限接入的开发者。
  - 需要在本地联调 `web <-> api <-> postgres` 的项目维护者。

## 目标

- 让 `apps/web` 脱离默认 demo，成为可继续扩展的工作台骨架。
- 让 `apps/api` 具备与 phase-1 路线图一致的元数据路由与模块边界。
- 让 PostgreSQL 成为实际可用的主业务元数据基线，并提供最小种子数据。
- 让前端从真实 API 读取 space/document 数据，而不是继续读取本地假数据。

## 非目标

- 不在本设计中实现正式登录、会话续期、RBAC 或租户隔离。
- 不接入 BlockNote 编辑器正文、协同房间、快照版本或索引任务。
- 不接通真实 AI provider、RAG 检索或流式聊天输出。
- 不在本设计中引入 Redis/Qdrant 的业务客户端和调用逻辑。

## 决策

### 决策 1：前端先稳定“路由 + Query + 元数据页壳”，而不是抢跑编辑器接入

- **选择**：
  - 在 `apps/web` 中优先落地 overview、space、document 三类路由。
  - 通过 `TanStack Query` 建立统一 API 读取入口。
- **理由**：
  - 当前路线图在 M2 要求“前端可展示文档树、文档页可进入”，这一步先把页面骨架和数据入口收口，比直接接 BlockNote 更符合阶段顺序。
  - 路由和数据层稳定后，后续接编辑器、搜索页和聊天页都会更顺。
- **考虑的替代方案**：
  - 直接跳到 BlockNote 单人编辑：能更快看到编辑器，但会让空间/文档元数据链路继续缺位。

### 决策 2：后端先按能力域拆 controller，不提前实现完整业务逻辑

- **选择**：
  - `apps/api` 先提供 `auth`、`spaces`、`documents`、`collaboration`、`ai`、`rag` 的显式路由与 controller 边界。
  - 当前只把 `spaces/documents` 接到真实 PostgreSQL 数据层，其余先保持占位响应。
- **理由**：
  - 这样既能提前固定 phase-1 的后端模块边界，又不需要在当前 change 中把所有功能实现做满。
  - 对前端当前真正需要的元数据链路来说，`spaces/documents` 是最关键的真实接口。
- **考虑的替代方案**：
  - 所有路由都继续返回内存假数据：短期更轻，但无法验证 PostgreSQL 和前后端联调链路。

### 决策 3：用 PostgreSQL + Lucid model/migration/seed 建立最小元数据基线

- **选择**：
  - 切换 starter 默认数据库配置到 PostgreSQL。
  - 建立 `spaces` 与 `documents` 模型、迁移与 baseline seed。
- **理由**：
  - 技术决策已经确认 PostgreSQL 是主业务数据库，本地基线不应继续停留在 SQLite。
  - seed 数据能让前端路由在本地立即看到真实列表和详情，降低联调摩擦。
- **考虑的替代方案**：
  - 继续使用 SQLite 做过渡：与既有技术决策冲突，且后续再切 PostgreSQL 会增加重复迁移成本。

### 决策 4：Redis/Qdrant 只补环境变量模板，不做超范围接线

- **选择**：
  - 在 `.env.example` 中补齐 `REDIS_*` 与 `QDRANT_*` 字段。
  - 不在本 change 中创建真实客户端、健康检查或业务调用。
- **理由**：
  - 当前路线图的 M1 要求“本地联通基础依赖”，而当前代码最需要的是先让配置口径一致。
  - 真正的 Redis/Qdrant 使用点分别属于后续协同/worker/RAG change。

## 风险与权衡

- 风险：当前 `auth`、`collaboration`、`ai`、`rag` 路由仍是占位实现，容易被误以为已经完成功能。
  - 缓解措施：在 proposal/specs/tasks 中明确这是一条 foundation change，只稳定路径和边界，不承诺完整业务闭环。
- 风险：前端现在虽然已经连上 API，但还没有错误边界、loading skeleton 和变更表单。
  - 缓解措施：把它作为后续 M2 change 的明确扩展点，而不是在当前 foundation change 中继续堆叠。
- 风险：`.env` 中 PostgreSQL 用户为 `root` 且密码为空，只适合本地开发。
  - 缓解措施：只把这一约定保留在本地环境与 `.env.example`，不作为生产默认配置。

## 迁移计划

- 上线步骤：
  - 创建新的 change 工件，正式承接 `web/api/postgres` 基线。
  - 校验 `apps/web` 路由与 Query 骨架是否符合 approved scope。
  - 校验 `apps/api` 路由边界、PostgreSQL 连接、迁移与 seed 是否符合 approved scope。
  - 将当前实现与 change 文档对齐后，作为后续 M2/M3 change 的基础。
- 回滚步骤：
  - 如发现当前骨架超出 M1/M2 foundation 范围，则回退新增路由、模型、迁移或 seed，并重新压缩到更小的 foundation scope。

## 待明确问题

- 问题：`spaces` 与 `documents` 的创建/编辑表单，是继续留到下一条 M2 change，还是要在当前 change 中补最小写接口验证。
  - 决策负责人：下一轮业务元数据 change。
- 问题：`auth` 占位接口何时替换为正式认证与会话实现。
  - 决策负责人：后续认证专项 change。
