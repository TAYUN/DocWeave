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

- 登录页展示的开发账号依赖 `apps/api/database/seeders/docweave_baseline_seeder.ts`。
- 如果本地数据库是空的，或者开发账号密码与当前 seed 不一致，请先执行：

```powershell
pnpm --dir apps/api exec node ace db:seed --files database/seeders/docweave_baseline_seeder.ts
```
