# DocWeave

DocWeave 是一个面向知识型团队的文档工作台，目标是把文档编辑、多人协同、AI 辅助改写与 RAG 检索收口到同一条产品链路里。

当前仓库已经完成 phase-1 的 Monorepo 工程骨架，并在前端建立了 `Mantine + TanStack Router + TanStack Query + BlockNote` 的基础接入方向。

## 项目定位

- 产品前端：`React SPA + Vite`
- UI 体系：`Mantine`
- 编辑器：`BlockNote`
- 主业务后端：`AdonisJS v7`
- 协同：`Yjs + Hocuspocus`
- AI / RAG：`Vercel AI SDK + Qdrant`

## 仓库结构

- `apps/`：运行时应用，当前包含 `web`、`api`、`collab`、`worker`
- `packages/`：共享能力包，承载 `auth`、`database`、`editor`、`ai`、`rag`、`ui` 等模块
- `infrastructure/`：本地开发依赖入口，包含 `postgres`、`redis`、`qdrant`、`minio`
- `docs/`：架构、决策、规划与协作文档
- `changes/`：`spec-superflow` 变更工件与执行痕迹

## 快速导航

- 项目路线图：[`ROADMAP.md`](./ROADMAP.md)
- Agent 协作约定：[`AGENTS.md`](./AGENTS.md)
- 设计规范：[`DESIGN.md`](./DESIGN.md)
- 前端实现规范：[`docs/workflow/frontend-mantine-implementation-guide.md`](./docs/workflow/frontend-mantine-implementation-guide.md)
- 前后端类型安全调用规范：[`docs/workflow/frontend-adonis-api-client-guide.md`](./docs/workflow/frontend-adonis-api-client-guide.md)
- 数据契约与适配层设计：[`docs/architecture/05. 数据契约与适配层设计.md`](./docs/architecture/05.%20数据契约与适配层设计.md)
- 文档总览：[`docs/文档总览.md`](./docs/%E6%96%87%E6%A1%A3%E6%80%BB%E8%A7%88.md)
- 最终技术方案：[`docs/decisions/01. 最终技术方案确认.md`](./docs/decisions/01.%20最终技术方案确认.md)
- 整体架构设计：[`docs/architecture/01. 整体架构设计.md`](./docs/architecture/01.%20整体架构设计.md)
- 当前实施路线图：[`docs/planning/00. 当前实施路线图.md`](./docs/planning/00.%20当前实施路线图.md)

## 当前状态

当前阶段优先目标不是一次性把整个平台做满，而是先把以下最小闭环稳定打通：

1. 账号与权限基础
2. 单人文档编辑
3. 多人协同编辑
4. 稳定快照与索引
5. 编辑器 AI 最小闭环
6. RAG 搜索与问答最小闭环

更细的阶段拆分和执行顺序见 [`ROADMAP.md`](./ROADMAP.md)。

## 开发说明

- 首次拉取项目、本地数据库为空或数据库被重建后，执行一次初始化：

```powershell
pnpm dev:setup
```

该命令依次执行数据库迁移和演示数据 seed，并创建登录页展示的开发账号。初始化完成后，日常开发只需启动 API 与 Web，无需每次登录前重复执行。

`dev:setup` 会刷新 `apps/api/database/seeders/docweave_baseline_seeder.ts` 管理的演示空间、文档和开发账号密码；需要保留本地测试数据时不要执行它。

## 常见问题

### 登录页提示“无法连接到服务器”

Web 开发服务器将 `/api` 代理到 `http://localhost:3333`。请同时启动 API 与 Web，并确认 API 健康检查可访问：

```powershell
pnpm dev:api
pnpm dev:web
Invoke-WebRequest http://localhost:3333/api/health
```

若健康检查正常但登录仍失败，且可以接受刷新本地演示数据，执行 `pnpm dev:setup` 恢复开发账号。不要把 Web 页面直接以静态文件方式打开，否则 Vite 的 `/api` 代理不会生效。

### 点击“保存文档”后正文没有变化

协同编辑器与普通保存是两条链路：协同服务可用时，正文由协同服务异步回写 API；协同服务不可用时，页面会降级为本地编辑器，点击“保存文档”才会提交正文。请先检查浏览器是否显示“协同已连接”或“本地降级编辑”，再刷新页面确认内容；协同服务需要以 `localhost:3334` 启动，并且 `COLLAB_SECRET` 要与 API 一致。

### 协同服务启动后出现 WebSocket closed before the connection is established

这是页面卸载、路由切换或协同连接在握手完成前被销毁时的浏览器警告。若页面随后显示“协同已连接”且多人编辑能够同步，可忽略；若持续出现并降级为本地编辑，请确认 `pnpm dev:collab` 正在监听 `localhost:3334`、API 为 `localhost:3333`，且两端使用相同的 `COLLAB_SECRET`。

### 知识库或知识问答提示“当前范围尚未建立索引”

打开需要进入知识库的文档，在顶部依次点击“保存并创建快照”（无未保存内容时显示为“创建稳定快照”）和“更新知识库”。第二步只会创建后台任务，需保持 `pnpm dev:worker` 运行；文档页状态显示“索引 vN”后，搜索知识库和知识问答才会使用该文档。
