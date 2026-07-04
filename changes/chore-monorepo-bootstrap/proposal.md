# 变更提案

## 背景（Why）

DocWeave 当前已经完成了技术方案、架构边界和第一阶段落地顺序的文档确认，但仓库本身仍然没有真正落地可执行的 Monorepo 工程外壳。继续停留在纯文档阶段，会让后续功能开发缺少统一目录、依赖管理、共享配置和多进程应用边界，导致每个后续需求都要重复做工程启动决策，增加返工和范围漂移风险。

现在需要先把工程初始化这一步做扎实，因为第一阶段的核心目标不是直接堆功能，而是优先建立后续不会频繁推翻的运行时边界、目录结构和共享基础设施入口。只有 Monorepo 外壳先稳定下来，后续 `apps/web`、`apps/api`、`apps/collab`、`apps/worker` 与各个 `packages/*` 的实现工作，才能在统一基线下持续推进。

## 变更内容（What Changes）

- 初始化 DocWeave 的 Monorepo 顶层工程外壳。
- 建立与现有规划文档一致的顶层目录结构，包括 `apps/`、`packages/`、`infrastructure/` 与基础工作区文件。
- 为前端、主业务后端、协同服务、worker 以及共享包预留明确目录与职责边界。
- 统一工作区级包管理、TypeScript 基线配置以及基础脚本入口，为后续子应用初始化提供公共底座。
- 约束第一阶段初始化范围，避免在本次变更中提前引入 `BullMQ`、`assistant-ui`、复杂导出体系或过度微服务拆分。

## 能力（Capabilities）

### 新增能力

- monorepo-workspace-shell
- multi-app-directory-baseline
- shared-package-boundary-baseline
- infrastructure-local-baseline
- workspace-tooling-baseline

### 修改能力

- 无

## 范围（Scope）

### 范围内（In Scope）

- 创建 Monorepo 顶层目录骨架与基础占位结构。
- 初始化工作区根配置，例如包管理工作区、TypeScript 基线、根级脚本和统一约束文件。
- 为 `apps/web`、`apps/api`、`apps/collab`、`apps/worker` 创建第一阶段所需的工程入口结构。
- 为 `packages/shared`、`packages/auth`、`packages/database`、`packages/editor`、`packages/ai`、`packages/rag`、`packages/collaboration`、`packages/ui`、`packages/config` 创建基础边界。
- 为本地开发所需的 `postgres`、`redis`、`qdrant`、`minio` 相关基础目录或配置入口预留位置。

### 范围外（Out of Scope）

- 不在本次变更中实现完整业务页面、业务 API、协同协议细节或 RAG 流程。
- 不在本次变更中完成生产级部署编排或 CI/CD 流水线。
- 不在本次变更中接入 `BullMQ`、`assistant-ui`、复杂任务调度或多 Agent 产品能力。
- 不在本次变更中补完认证权限、上传存储、Presence、编辑器 AI 等专项设计细节。

## 影响（Impact）

- 影响的代码区域：仓库根目录、`apps/`、`packages/`、`infrastructure/` 以及根级工程配置文件。
- 影响的 API 或接口：主要影响内部工程边界与工作区约定，暂不引入稳定对外业务接口。
- 依赖或涉及的外部系统：`pnpm` 工作区、TypeScript、React/Vite、AdonisJS、Hocuspocus/Yjs、PostgreSQL、Redis、Qdrant、MinIO 等第一阶段基线组件。
