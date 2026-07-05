# 变更提案

## 背景（Why）

当前项目的正式方案文档仍把产品 UI 组件库写成 `shadcn/ui`，并把 BlockNote 编辑器 UI 适配层写成 `@blocknote/shadcn`。但仓库实际已经在 `packages/editor` 中接入了 `@blocknote/mantine`，而 `apps/web` 也尚未形成真正落地的 `shadcn/ui` 组件体系。

在这种状态下，继续保留 `shadcn/ui` 作为书面基线会带来两类问题：一是方案文档与实际实现不一致，后续变更容易围绕错误前提继续扩散；二是产品 UI 与编辑器 UI 若分别站在不同组件体系上，后续主题、弹层、表单、通知和视觉一致性会持续增加维护成本。

BlockNote 官方当前提供 `shadcn / mantine / ariakit` 三套 UI 适配路径，并在 Mantine 集成文档中给出了完整的推荐接入方式。既然本次已经明确要把产品整体 UI 统一为 Mantine，那么编辑器适配层也应同步固化为 `@blocknote/mantine`，并遵循官方关于 `blocknoteStyles.css` 的集成建议。

## 变更内容（What Changes）

- 修改 `docs/decisions/01. 最终技术方案确认.md`，将产品 UI 基线从 `shadcn/ui` 调整为 `@mantine/core` 体系，并把编辑器 UI 适配层明确为 `@blocknote/mantine`。
- 修改 `docs/planning/00. 当前实施路线图.md` 中与前端组件体系、编辑器接入方式相关的技术栈描述，确保路线图与决策文档一致。
- 调整 `apps/web` 的前端 UI 基线，引入 `@mantine/core`、`@mantine/hooks`、`@mantine/notifications`、`@mantine/utils`，在应用入口挂载 `MantineProvider`，并把当前产品壳层与页面交互组件统一切到 Mantine 系列。
- 调整 `packages/editor` 的 BlockNote 适配层，继续使用 `@blocknote/mantine`，并在全局已启用 Mantine 的前提下改为引入 `@blocknote/mantine/blocknoteStyles.css`，避免重复引入 Mantine 核心样式。

## 能力（Capabilities）

### 新增能力

- mantine-product-ui-foundation
- blocknote-mantine-adapter-alignment

### 修改能力

- web-workspace-shell
- blocknote-web-integration-baseline
- single-user-document-editor-baseline

## 范围（Scope）

### 范围内（In Scope）

- 决策文档与路线图中的 UI 技术栈表述对齐
- `apps/web` 产品 UI 组件库切换到 Mantine
- 保留 `Tailwind CSS v4` 作为布局和细节样式工具
- `packages/editor` 的 BlockNote Mantine 适配与样式导入策略对齐官方推荐
- 将当前前端页面中使用的自定义交互组件替换为 Mantine 等价组件或容器

### 范围外（Out of Scope）

- 不调整 React SPA、Vite、TanStack Router、TanStack Query 的整体架构
- 不改变文档编辑、元数据读写、查询与保存的业务逻辑
- 不修改协同、Yjs、Hocuspocus、collab token 或 WebSocket 相关代码
- 不接入 `@blocknote/xl-ai`、`@blocknote/xl-ai/server` 或聊天 / Copilot 新能力
- 不引入新的设计品牌重构、复杂主题系统或跨端视觉大改版

## 影响（Impact）

- 影响的代码区域：`docs/decisions`、`docs/planning`、`apps/web`、`packages/editor`
- 影响的依赖关系：前端从“规划中的 `shadcn/ui` 基线”切换到 `Mantine` 组件体系，编辑器适配层统一为 `@blocknote/mantine`
- 影响的样式策略：全局样式入口需要同时承接 Mantine CSS variables 与现有 Tailwind 工具类能力
- 影响的验证方式：需要确认前端入口 Provider、页面交互组件和 BlockNote 样式导入方式均与官方 Mantine 集成方案一致
