# DocWeave 文档总览

本文档用于统一 `docs/` 目录的阅读入口、文档分层和当前有效口径。

当前文档体系按六类组织：

1. `decisions/`：技术选型、关键取舍、最终拍板结论。
2. `architecture/`：系统边界、模块职责、核心数据流和运行时拆分。
3. `planning/`：阶段路线、实施顺序和第一阶段节奏。
4. `workflow/`：工程协作方式、agent 使用约定和研发流程说明。
5. `ui/`：页面清单、单页规格、导航流转和 UI 相关索引。
6. `tem/`：早期草稿、讨论记录和未收口材料。

前端相关文档当前按下面方式分工：

1. 根目录 [`DESIGN.md`](../DESIGN.md)：只负责设计规范与视觉语言。
2. [`ui/page-inventory.md`](./ui/page-inventory.md)：负责页面总览、路由语义、导航流转和阶段状态。
3. [`ui/app-shell-layout.md`](./ui/app-shell-layout.md)：负责 `AppHeader`、Sidebar 与应用壳层布局规格。
4. [`workflow/frontend-route-architecture.md`](./workflow/frontend-route-architecture.md)：负责前端路由拆分、目录树和页面代码组织边界。
5. [`workflow/frontend-mantine-implementation-guide.md`](./workflow/frontend-mantine-implementation-guide.md)：只负责 `Mantine` 默认主题下的实现规范。
6. [`workflow/frontend-adonis-api-client-guide.md`](./workflow/frontend-adonis-api-client-guide.md)：负责 `apps/web` 与 `apps/api` 之间的类型安全 API 调用约定。

## 推荐阅读顺序

如果是第一次进入项目，建议按以下顺序阅读：

1. [最终技术方案确认](./decisions/01.%20最终技术方案确认.md)
2. [整体架构设计](./architecture/01.%20整体架构设计.md)
3. [当前实施路线图](./planning/00.%20当前实施路线图.md)
4. [第一阶段验收标准与测试策略](./planning/10.%20第一阶段验收标准与测试策略.md)
5. [Monorepo 初始化与目录落地方案](./planning/11.%20Monorepo%20初始化与目录落地方案.md)
6. [RAG 与 Citation 设计](./architecture/20.%20RAG%20与%20Citation%20设计.md)
7. [spec-superflow 工作流接入说明](./planning/12.%20spec-superflow%20工作流接入说明.md)
8. [Agent Workflow Guide](./workflow/agent-workflow.md)
9. [页面总览地图](./ui/page-inventory.md)
10. [应用壳层布局规格](./ui/app-shell-layout.md)
11. [Frontend Route Architecture Guide](./workflow/frontend-route-architecture.md)
12. [Frontend Mantine Implementation Guide](./workflow/frontend-mantine-implementation-guide.md)
13. [Frontend Adonis API Client Guide](./workflow/frontend-adonis-api-client-guide.md)

## 外部参考

涉及 `BlockNote` 开发时，遇到不清楚的能力、API、集成方式或示例实现，优先查阅官方站点：

1. [BlockNote 官网](https://www.blocknotejs.org/)
2. [BlockNote 文档](https://www.blocknotejs.org/docs)
3. [BlockNote 使用示例](https://www.blocknotejs.org/examples)
4. 上述官方站点应作为项目内 `BlockNote` 相关实现的第一参考来源，尤其在查 API 和示例实现时优先查看。

## 当前统一口径

截至当前，项目已经统一为以下执行摘要：

1. 前端主形态采用 `React SPA + Vite + TanStack Router + TanStack Query`。
2. UI 采用 `Tailwind CSS v4 + @mantine/core + @mantine/hooks + @mantine/notifications + lucide-react`。
3. 编辑器采用 `@blocknote/core + @blocknote/react + @blocknote/mantine`。
4. 编辑器 AI 前端采用 `@blocknote/xl-ai`。
5. 主业务后端采用 `AdonisJS v7`。
6. 协同采用 `Yjs + Hocuspocus`，并作为独立进程运行。
7. 编辑器 AI 后端采用 `@blocknote/xl-ai/server + Vercel AI SDK`。
8. 聊天 / Copilot 第一阶段先使用轻量自定义 UI，后续按需接入 `assistant-ui`。
9. 文档服务端处理、快照 / 导出 / RAG 前处理优先采用 `@blocknote/server-util`。
10. RAG 由项目内 `packages/rag` 自建，第一阶段直接对接 `Qdrant`。
11. 主业务数据库为 `PostgreSQL`，缓存与后续队列基线为 `Redis`。
12. 对象存储统一按 `S3-compatible` 抽象设计，本地默认 `MinIO`。
13. 第一阶段先保留任务抽象和数据库轮询 worker，不急于引入 `BullMQ`。

## 文档之间的优先级

阅读时按以下优先级理解：

1. `decisions/01. 最终技术方案确认` 是当前总基线。
2. `architecture/` 文档负责把技术基线展开成边界、职责和数据流。
3. `planning/` 文档负责把“做什么”转成“先做什么、怎么做”。
4. `tem/` 仅保留草稿和讨论记录，不作为最终执行依据。
5. `workflow/` 用于约定如何使用 Codex、skills、MCP 和 subagents 参与协作。

## 当前建议

后续如果要继续扩展文档体系，建议优先补：

1. 认证与权限决策文档。
2. 文件存储与上传策略文档。
3. 协同 token 与 Presence 设计文档。
4. BlockNote 服务端能力接入文档，明确 `@blocknote/xl-ai/server` 与 `@blocknote/server-util` 在 `AdonisJS` 中的落点。
5. 前端默认主题与组件实现规范，统一 `Mantine` 默认主题下的页面实现方式。

## Agent 协作入口

如果要了解当前项目如何使用 Codex、skills、MCP 与 subagents，优先阅读：

1. [Agent Workflow Guide](./workflow/agent-workflow.md)
