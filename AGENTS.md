# DocWeave Agent Guide

本文档是仓库根目录的协作入口，约定人在 DocWeave 中如何与主 agent、skills、MCP 和 subagents 协作。更完整的背景说明见 [`docs/workflow/agent-workflow.md`](./docs/workflow/agent-workflow.md)。

## 目标

- 让 agent 协作降低上下文切换成本，而不是放大协调成本
- 让实现、研究、审查三类工作有清晰分工
- 让产出的代码、文档与设计口径保持统一

## 默认协作模式

DocWeave 默认采用"主 agent 收口，子 agent 辅助"的模式：

- 主 agent：负责理解需求、落地实现、运行验证、整理结果
- 子 agent：负责探索、资料研究、独立 review

默认不建议让多个 agent 同时修改同一条业务链路上的代码。

## 什么时候值得开子 Agent

满足以下任意 2 到 3 条时，通常值得开子 agent：

- 需求横跨 `apps/web`、`apps/api`、`apps/collab`、`apps/worker` 或多个 `packages/*`
- 需要同时梳理代码现状和官方文档口径
- 需要一个独立视角检查回归风险、接口契约或测试缺口
- 子任务可以一句话说清，例如"定位文档保存链路"或"确认 Mantine 官方推荐接入方式"

## 什么时候不要拆

- 改动只涉及一个文件或一条很短的链路
- 需求边界还不清楚
- 多个 agent 会改同一批文件
- 只是为了并行而并行，没有明确分工

## DocWeave 的资料优先级

### 代码与仓库现状

1. 先看仓库当前实现
2. 再看 `docs/` 里的决策、架构和规划文档
3. 如仓库根目录存在 `.codegraph/`，优先用 `CodeGraph` 理解调用链和符号关系

### 官方文档

1. `Mantine` 相关问题优先看官方文档，尤其是 Getting Started、`MantineProvider`、theme object、Styles API
2. `BlockNote` 相关问题优先看官方文档和示例
3. `AdonisJS`、MCP、`@jrmc/adonis-mcp`、OpenAI / Codex 等接入问题优先查官方资料

### MCP 工具

当需要读取或写入 DocWeave 的空间/文档数据时，可通过 `docweave-mcp` 直接调用后端能力：

- `list_spaces` / `create_space` / `get_space_tree` — 空间管理
- `create_document` / `get_document` / `update_document` — 文档 CRUD
- `search_knowledge` — RAG 知识检索

MCP 服务注册在 `reasonix.toml` 的 `[[plugins]]` 中，启动命令为 `pnpm --dir apps/api mcp:start`。

## 前端设计约定

- 产品 UI 统一优先采用 `Mantine`，不要平行造第二套组件语言
- 设计语言、状态外观、视觉气质统一以 [`DESIGN.md`](./DESIGN.md) 为入口
- `Mantine` 默认主题下的实现规则、props 使用与 CSS 落地边界统一以 [`docs/workflow/frontend-mantine-implementation-guide.md`](./docs/workflow/frontend-mantine-implementation-guide.md) 为入口

- 当前代码事实来源以 `apps/web/src/main.tsx` 中的 `MantineProvider` 和页面实现为准
- 新增界面时，优先按"`Mantine` 组件默认行为 -> 必要时显式 props -> Styles API / `classNames` / `styles` -> CSS Modules"的顺序落地
- `Tailwind CSS v4` 仅作为布局和细节补充，不用于重做按钮、表单、弹层、导航等本该由 `Mantine` 统一的组件层
- 涉及 `Mantine` 的用法、样式机制或覆盖方式时，优先查官方文档，尤其是 `MantineProvider`、theme object、Mantine styles 与 Styles API

## 数据规范设计

- 涉及 `contracts`、`adapters`、`application`、`view-model` 与 `Tuyau` 边界时，统一以 [`docs/architecture/05. 数据契约与适配层设计.md`](./docs/architecture/05.%20数据契约与适配层设计.md) 为入口
- `apps/web` 与 `apps/api` 之间的类型安全 API 调用、Tuyau 接入和后续扩展流程统一以 [`docs/workflow/frontend-adonis-api-client-guide.md`](./docs/workflow/frontend-adonis-api-client-guide.md) 为入口

## 文档约定

- `README.md`：项目介绍与导航入口
- `ROADMAP.md`：阶段路线与工程推进顺序
- `DESIGN.md`：设计系统与视觉规范入口
- `reasonix.toml`：Reasonix 项目级配置（skills 路径、MCP 插件等）
- `docs/`：详细的决策、架构、规划与协作资料

## spec-superflow 工作流

当仓库中存在 `.spec-superflow.yaml`、`changes/`、`proposal.md`、`specs/`、`design.md`、`tasks.md` 或 `execution-contract.md` 时，优先按 spec-superflow 工作流推进，并主动选择合适的 skill。

| Skill               | 阶段 | 职责                                     |
| ------------------- | ---- | ---------------------------------------- |
| `workflow-start`    | 入口 | 内容级状态检测、8 状态路由、阻止非法跳转 |
| `need-explorer`     | 探索 | 一次一问 + 方案对比 + 推荐               |
| `spec-writer`       | 规格 | 产出 proposal/specs/design/tasks         |
| `contract-builder`  | 桥接 | 提取工件 → execution-contract.md         |
| `build-executor`    | 执行 | TDD 铁律 + SDD 子代理驱动                |
| `bug-investigator`  | 调试 | 4 阶段根因分析，3+ 修复失败 → 质疑架构   |
| `code-reviewer`     | 审查 | 结构化审查，三级问题分级                 |
| `release-archivist` | 收口 | 验证 + 归档 + 风险总结                   |
| `spec-merger`       | 同步 | Delta Spec → 主规范智能合并              |

### spec-superflow 约定

- 只要任务明确要求按 `spec-superflow` 推进，进入 `closing` 时默认必须参考 [`docs/workflow/spec-superflow-closing-sop.md`](./docs/workflow/spec-superflow-closing-sop.md)，不能只口头宣布完成。
- `closing` 前，`changes/<change-name>/tasks.md` 中不应保留任何 `- [ ]`。
- 修改过 `proposal.md`、`specs/`、`design.md`、`tasks.md` 后，进入 `closing` 前默认先执行 `ssf state rebuild "<absolute-change-dir>"`。
- 进入 `closing` 时，执行项目本地 skill [`.agents/skills/spec-superflow-closing/scripts/close-change.mjs`](./.agents/skills/spec-superflow-closing/scripts/close-change.mjs)；它会检查任务是否勾完、校验 `.spec-superflow.yaml` 关键字段，并刷新 `audit`。
- `ssf state transition`、`ssf state rebuild`、`ssf audit` 涉及 change 路径时，优先使用绝对路径，避免 Windows / guard 误判工件缺失。
- 注意：pnpm 全局包中的技能仍包含 `${CLAUDE_PLUGIN_ROOT}` 引用（Claude Code 环境变量），在 Reasonix 中不会展开。相关脚本路径请按实际仓库位置自行推断或使用 `ssf` CLI 替代。

## 推荐执行顺序

面对一个中等复杂度任务时，推荐按下面顺序推进：

1. 主 agent 明确目标与边界
2. 必要时开一个 explorer 类 agent 摸底代码
3. 涉及三方库或框架时补一轮官方资料确认
4. 主 agent 落地改动并跑验证
5. 必要时开一个 reviewer 类 agent 做独立审查

## 一句话原则

在 DocWeave 里，多 agent 的价值不在于"很多人一起写"，而在于"把探索、研究、审查从主实现链路里解耦出来，再由主 agent 统一收口"。
