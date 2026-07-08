# DocWeave Roadmap

本文档承接根目录原 `README.md` 中的工程落地说明，专门回答“这个仓库当前已经落了什么、下一步按什么顺序推进”。

## 当前工程基线

DocWeave 当前先落地 Monorepo 工程壳，目的是为后续各运行时和共享包的增量初始化提供稳定边界。

### Top-Level Structure

- `apps/`：phase-1 运行时目录，包含 `web`、`api`、`collab`、`worker`
- `packages/`：phase-1 共享能力目录，包含 `shared`、`auth`、`database`、`editor`、`ai`、`rag`、`collaboration`、`ui`、`config`
- `infrastructure/`：本地开发依赖入口，包含 `postgres`、`redis`、`qdrant`、`minio`
- `changes/`：`spec-superflow` 变更工件与执行痕迹
- `docs/`：架构、规划与项目文档

## 协作入口

- 项目内关于 Codex、skills、MCP 和 subagents 的协作约定，见 [`docs/workflow/agent-workflow.md`](./docs/workflow/agent-workflow.md)
- 面向仓库根目录的协作摘要，见 [`AGENTS.md`](./AGENTS.md)

## Workspace Baseline

- 使用 `pnpm workspace` 管理 `apps/*` 与 `packages/*`
- 使用根 `tsconfig.base.json` 作为后续子项目共享 TypeScript 基线
- 根脚本只提供 phase-1 运行时入口，不预置第二阶段依赖

## Scaffold Choices

- `apps/web` 采用 `Vite` 官方 `react-ts` 脚手架，契合已确认的 `React SPA` 方向，并保留后续接入 `TanStack Router`、`TanStack Query`、`Mantine` 与编辑器能力的空间
- `apps/api` 采用 `AdonisJS v7` 官方 `api` starter kit，其目录结构符合标准后端形态，便于继续承载认证、权限、文档元数据、文件与 AI / RAG 编排
- 当前不选择带前端耦合的 `AdonisJS` UI 类 starter，避免与根 `apps/web` 的独立 SPA 边界冲突

## 当前阶段目标

第一阶段不追求“技术栈全装齐”，而是先按下面顺序建立最小闭环：

```text
工程骨架
  -> 单人编辑
  -> 协同
  -> 稳定快照
  -> 索引
  -> 编辑器 AI
  -> RAG 搜索与问答
```

只要这个顺序不乱，后续再接 `BullMQ`、`assistant-ui`、导出和更复杂的检索能力都会顺很多。

## Non-Goals

- 当前不包含业务页面、业务 API、协同协议细节或 RAG 处理链实现
- `infrastructure/` 仅服务本地开发入口，不代表完整生产编排

## 进一步阅读

- 文档总入口：[`docs/文档总览.md`](./docs/%E6%96%87%E6%A1%A3%E6%80%BB%E8%A7%88.md)
- 当前实施路线图：[`docs/planning/00. 当前实施路线图.md`](./docs/planning/00.%20当前实施路线图.md)
- 第一阶段验收标准：[`docs/planning/10. 第一阶段验收标准与测试策略.md`](./docs/planning/10.%20第一阶段验收标准与测试策略.md)
- Monorepo 初始化方案：[`docs/planning/11. Monorepo 初始化与目录落地方案.md`](./docs/planning/11.%20Monorepo%20初始化与目录落地方案.md)
