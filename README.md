# DocWeave

DocWeave 当前先落地 Monorepo 工程壳，目的是为后续各运行时和共享包的增量初始化提供稳定边界。

## Top-Level Structure

- `apps/`: phase-1 运行时目录，包含 `web`、`api`、`collab`、`worker`
- `packages/`: phase-1 共享能力目录，包含 `shared`、`auth`、`database`、`editor`、`ai`、`rag`、`collaboration`、`ui`、`config`
- `infrastructure/`: 本地开发依赖入口，包含 `postgres`、`redis`、`qdrant`、`minio`
- `changes/`: `spec-superflow` 变更工件与执行痕迹
- `docs/`: 架构、规划与项目文档

## Workspace Baseline

- 使用 `pnpm workspace` 管理 `apps/*` 与 `packages/*`
- 使用根 `tsconfig.base.json` 作为后续子项目共享 TypeScript 基线
- 根脚本只提供 phase-1 运行时入口，不预置第二阶段依赖

## Scaffold Choices

- `apps/web` 采用 Vite 官方 `react-ts` 脚手架，契合已确认的 `React SPA` 方向，并保留后续接入 `TanStack Router`、`TanStack Query` 与编辑器能力的空间
- `apps/api` 采用 AdonisJS v7 官方 `api` starter kit，其目录结构符合标准后端形态，便于继续承载认证、权限、文档元数据、文件与 AI / RAG 编排
- 当前不选择带前端耦合的 AdonisJS UI 类 starter，避免与根 `apps/web` 的独立 SPA 边界冲突

## Non-Goals

- 当前不包含业务页面、业务 API、协同协议细节或 RAG 处理链实现
- `infrastructure/` 仅服务本地开发入口，不代表完整生产编排
