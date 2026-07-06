# Agent Workflow Guide

## 目的

这份文档用于约定 DocWeave 在日常开发中如何使用主 agent、skills、MCP 和 subagents。

核心目标有两个：

- 让 agent 协作真正降低上下文切换和沟通成本
- 避免为了“并行”而并行，反而把实现链路拆碎

## 总原则

在传统前后端分离项目里，多 agent 更适合承担以下三类工作：

- 探索：定位代码、梳理调用链、确认边界
- 研究：查官方文档、版本差异、接入范式
- 审查：独立 review、识别回归风险和测试缺口

默认不建议让多个 agent 同时写同一条业务链路上的代码。

在 DocWeave 里，推荐采用“主 agent 收口，子 agent 辅助”的模式：

- 主 agent 负责实现、改代码、跑验证、整理结果
- 子 agent 负责补上下文、补证据、补独立视角

## 什么时候该开独立 Agent

满足以下任意 3 条，通常值得开一个独立 agent：

- 需求已经明确，但需要同时摸前端和后端现状
- 一条需求横跨 `apps/web`、`apps/api`、`apps/collab`、`apps/worker` 或 `packages/*`
- 需要一个独立视角做 review，而不是实现者自查
- 需要查官方文档、第三方库范式、版本差异或接入方式
- 任务能拆成一句话说清的子目标，例如“定位调用链”或“检查回归风险”
- 信息收集明显比写代码更耗时

如果只满足 1 到 2 条，通常主 agent 直接处理更高效。

## 什么时候不该开

以下场景不建议拆子 agent：

- 需求还没讲清楚
- 改动很小，只涉及一个文件或一条很短的链路
- 多个 agent 会改同一批文件
- 业务规则还在变化，今天探索出的结论很快会失效
- 只是为了“显得并行”，但没有明确分工

## 传统前后端分离项目的建议

对于传统前后端分离项目，推荐这样理解独立 agent 的价值：

- 用独立 agent 做前后端并行摸底，而不是并行乱改
- 用独立 agent 做协议检查、接口契约检查和回归审查
- 用独立 agent 做资料研究，减少主线实现中的频繁跳出

不建议默认长期固定成“前端一个 agent、后端一个 agent 同时写实现”的工作流。

更稳的模式是：

1. 一个 agent 负责摸底或研究
2. 主 agent 负责最终实现
3. 一个 agent 负责独立 review

## DocWeave 的推荐分工

### 主 Agent

主 agent 负责：

- 汇总用户需求
- 决定是否需要子 agent
- 落地最终代码改动
- 运行验证
- 对外输出最终结论

### `docweave-explorer`

适合的任务：

- 定位前后端入口
- 梳理 controller、service、model、editor、worker 之间的调用链
- 识别现有能力与用户诉求的差异

不适合的任务：

- 直接承担大块实现
- 在未确认边界前随意设计新架构

### `docweave-docs-researcher`

适合的任务：

- 查 AdonisJS、`@jrmc/adonis-mcp`、BlockNote、Mantine、OpenAI/Codex 等官方文档
- 确认当前推荐安装方式、配置格式、API 形状和官方边界
- 判断某个仓库或方案是不是官方
- 涉及前端时，先区分“设计规范问题”与“实现规范问题”：
  - 设计规范优先看根目录 [`DESIGN.md`](../../DESIGN.md)
  - `Mantine` 默认主题下的实现规范优先看 [`frontend-mantine-implementation-guide.md`](./frontend-mantine-implementation-guide.md)
  - 如果问题涉及 `apps/web` 调 `apps/api`、Tuyau、registry 或 TanStack Query 与 Adonis API 的衔接，优先看 [`frontend-adonis-api-client-guide.md`](./frontend-adonis-api-client-guide.md)

不适合的任务：

- 仅凭社区博客或记忆输出结论
- 把未证实的推测包装成建议

### `docweave-reviewer`

适合的任务：

- 检查回归风险
- 检查前后端接口契约是否错位
- 检查文档内容结构、状态字段、空值分支、not found 分支、权限边界
- 检查测试缺口和验证盲区

不适合的任务：

- 在 review 还没完成前直接推动大改
- 用概述替代 findings

## DocWeave 里适合开子 Agent 的任务

以下任务适合多 agent 辅助：

- 文档编辑、保存、发布这类横跨前后端的功能
- RAG 搜索、AI 编辑、协同编辑接入
- MCP、BlockNote、Mantine、OpenAI/Codex 相关集成
- 需要兼顾 API、编辑器内容结构和状态流转的高风险改动

推荐流程：

1. `docweave-explorer` 先摸底
2. 必要时 `docweave-docs-researcher` 查资料
3. 主 agent 实现
4. `docweave-reviewer` 做收尾检查

## DocWeave 里不建议拆太细的任务

以下任务通常不需要多 agent：

- 单文件样式调整
- 一个小表单字段修正
- 单个 controller 的轻量返回字段修改
- 需求尚处于 scaffold 或占位阶段的简单补全

这类任务主 agent 直接完成通常更快。

## 推荐工作模式

### 模式一：单主线

适合小需求。

- 主 agent 直接处理
- 不开子 agent

### 模式二：探索 + 实现 + 审查

适合中等复杂度改动，也是 DocWeave 最常用的模式。

1. `docweave-explorer` 做代码摸底
2. 主 agent 实现
3. `docweave-reviewer` 做回归审查

### 模式三：研究 + 探索 + 实现

适合新库接入、配置接入和版本差异确认。

1. `docweave-docs-researcher` 查一手资料
2. `docweave-explorer` 对照仓库现状
3. 主 agent 落地实现

## 控制规则

为了避免 agent 协作失控，约定如下：

- 同时活跃的子 agent 尽量不超过 2 个
- 不让两个 agent 修改同一批文件
- 子 agent 优先承担“读、查、审”，主 agent 负责“写、改、收口”
- 需求没讲清前，不开启并行实现
- 每个子 agent 的任务必须一句话说清楚

## 和项目目录的关系

项目级 skills 统一放在：

- `.agents/skills/`

项目级 subagents 统一放在：

- `.codex/agents/`

项目级 Codex 配置放在：

- `.codex/config.toml`

其中：

- skills 用于沉淀可复用的工作知识和资料入口
- subagents 用于沉淀可复用的协作角色
- MCP 用于把 DocWeave 自己的业务能力暴露给 Codex 调用

## 一句话结论

DocWeave 适合使用多子 agent 辅助开发，但最佳方式不是“大量并行写代码”，而是“主 agent 实现，子 agent 做探索、研究和审查”。
