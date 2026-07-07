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

### `docweave-ui-reviewer`

适合的任务：

- 评审页面方案、线框说明和前端页面实现
- 检查页面主任务、信息层级、主次操作与状态完整性
- 检查页面是否偏离 [`DESIGN.md`](../../DESIGN.md) 的工作台气质
- 检查实现是否偏离 [`frontend-mantine-implementation-guide.md`](./frontend-mantine-implementation-guide.md) 的 Mantine 默认边界
- 识别 AI 生成页面里常见的“结构没问题看起来却不对”或“看起来很满但不可用”的问题

不适合的任务：

- 在页面目标还没定义前直接替产品拍板
- 用个人审美偏好否定已有明确设计约束
- 在没有页面上下文时只看局部样式做过度结论

### `docweave-ui-planner`

适合的任务：

- 把功能需求整理成页面清单、页面目标和页面流转关系
- 为新增页面或页面改造补齐信息架构、主次操作和状态规格
- 判断某个需求应该新增页面、扩展现有页面，还是只补一个局部交互
- 在 AI 开始写页面前，先产出 `docs/ui/pages/` 风格的文本级规格
- 页面信息架构统一沉淀到 [`../ui/page-inventory.md`](../ui/page-inventory.md)
- 如果任务已经进入前端实现拆分，再补充或对齐 [`frontend-route-architecture.md`](./frontend-route-architecture.md) 中的路由与目录边界

不适合的任务：

- 直接跳过页面定义进入视觉发挥或代码实现
- 在已有页面规格明确时重复发明另一套结构
- 只根据审美偏好增加区块、入口或页面层级

### `docweave-frontend-architect`

适合的任务：

- 审核 `apps/web` 的路由拆分、目录分层和页面模块组织
- 检查是否遵守 [`frontend-route-architecture.md`](./frontend-route-architecture.md) 中的 `layout / routes / pages / features` 边界
- 识别“虽然能跑，但会继续把前端推回大文件耦合”的实现方式
- 在页面大改版或路由重构前，判断某个改动应该落在 layout、route、page 还是 feature

不适合的任务：

- 直接替代 `docweave-ui-planner` 定义页面
- 直接替代 `docweave-ui-reviewer` 判断视觉气质或组件观感
- 只给抽象的最佳实践，不结合 DocWeave 当前目录和文档边界
- 在没有实际改动、重构计划或候选方案时空泛审查

## DocWeave 里适合开子 Agent 的任务

以下任务适合多 agent 辅助：

- 文档编辑、保存、发布这类横跨前后端的功能
- RAG 搜索、AI 编辑、协同编辑接入
- MCP、BlockNote、Mantine、OpenAI/Codex 相关集成
- 需要兼顾 API、编辑器内容结构和状态流转的高风险改动

推荐流程：

1. `docweave-explorer` 先摸底
2. 必要时 `docweave-docs-researcher` 查资料
3. 涉及页面设计时，由 `docweave-ui-planner` 先产出页面规格
4. 涉及前端结构演进时，由 `docweave-frontend-architect` 先守一轮实现架构边界
5. 主 agent 实现
6. `docweave-reviewer` 做行为与回归检查
7. 涉及页面体验时，由 `docweave-ui-reviewer` 补一轮 UI 评审

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

### 模式二点五：页面规划 + 实现 + UI 评审

适合新增页面、页面大改版，或用户明确表示“AI 生成页面总是不满意”的场景。

1. `docweave-ui-planner` 先定义页面清单、每页目标和状态规格
2. 主 agent 或实现 agent 根据规格落地页面
3. `docweave-ui-reviewer` 对照规格和设计基线做 UI 评审

### 模式二点七：页面规划 + 架构守门 + 实现 + UI / 代码评审

适合页面大改版、`router.tsx` 拆分、布局重构，或用户明确担心 AI 把前端继续做乱的场景。

1. `docweave-ui-planner` 先定义页面清单、每页目标和状态规格
2. `docweave-frontend-architect` 检查路由树、目录树和模块边界
3. 主 agent 根据页面规格和实现架构落地改动
4. `docweave-reviewer` 做行为与回归审查
5. `docweave-ui-reviewer` 做页面体验与设计基线评审

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
