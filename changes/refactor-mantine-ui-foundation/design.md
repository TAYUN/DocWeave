# 技术设计

## 上下文

- 当前状态：
  - `docs/decisions/01. 最终技术方案确认.md` 仍将产品 UI 组件库写为 `shadcn/ui`，并将编辑器 UI 适配层写为 `@blocknote/shadcn`。
  - `packages/editor` 实际已经接入 `@blocknote/mantine`，但当前样式导入方式仍是 `@blocknote/mantine/style.css`。
  - `apps/web` 目前主要依赖自定义 `App.css` 与 `index.css` 维护页面壳层、表单和按钮样式，尚未真正形成 `shadcn/ui` 组件体系。
  - `apps/web/src/main.tsx` 目前只挂载了 `QueryClientProvider` 与 `RouterProvider`，还没有统一的组件库 Provider。
- 约束条件：
  - 本次变更只调整 UI 组件体系和编辑器 UI 适配层，不改变现有读写逻辑、Query/Mutation 流程与路由结构。
  - `React SPA`、`Vite`、`TanStack Router`、`TanStack Query` 与 `Tailwind CSS v4` 必须保留。
  - 协同、Yjs、Hocuspocus、AI 与 RAG 相关代码不在本次范围内。
  - BlockNote 的 Mantine 接入必须遵循官方文档，已全局接入 Mantine 的应用应使用 `@blocknote/mantine/blocknoteStyles.css`，避免重复引入 Mantine 核心样式。

## 目标

- 让正式技术方案与实际实现统一到 Mantine 方向
- 让 `apps/web` 获得稳定的 Mantine 组件基线与 Provider 入口
- 让 `packages/editor` 与产品 UI 使用同一套 Mantine 体系
- 在保留 Tailwind 的前提下，减少当前 ad hoc 交互样式的继续扩散

## 非目标

- 不进行品牌视觉重做或全量信息架构调整
- 不重写现有页面的数据查询、mutation、路由或 API 协议
- 不引入新的协同、AI、导出、快照或 RAG 功能
- 不把当前项目改造成完全依赖 Tailwind utility 的样式体系

## 决策

### 决策 1：产品 UI 与编辑器 UI 同时统一到 Mantine

- **选择**：
  - 将产品 UI 组件库正式确定为 `@mantine/core + @mantine/hooks + @mantine/notifications`，并将编辑器 UI 适配层正式确定为 `@blocknote/mantine`。
- **理由**：
  - 当前项目还没有沉淀出真正的 `shadcn/ui` 组件体系，切换成本主要集中在入口和页面交互组件，而不是大规模现有资产迁移。
  - BlockNote 官方已经提供 Mantine 适配路径，产品 UI 与编辑器 UI 统一到同一组件生态后，主题、弹层、表单、通知和排版行为更容易保持一致。
  - 这能消除“文档写的是 shadcn，代码跑的是 Mantine”的方案漂移问题。
- **备选方案**：
  - 保持产品 UI 走 `shadcn/ui`，仅编辑器继续使用 `@blocknote/mantine`。
  - 该方案被拒绝，因为它会在产品壳层和编辑器壳层之间长期保留两套组件语义与样式系统。

### 决策 2：Mantine 负责组件基线，Tailwind 保留为布局与微调工具

- **选择**：
  - 在 `apps/web` 中引入 `MantineProvider` 作为应用级组件库入口，由 Mantine 负责表单、按钮、布局容器、反馈组件等交互基线；Tailwind CSS 继续保留，用于布局、间距和少量自定义样式微调。
- **理由**：
  - Mantine 提供完整且一致的交互组件集合，能替代当前页面中自定义按钮、输入框、卡片、提示块的重复实现。
  - Tailwind 作为工具类样式保留，可以避免简单布局都退回到长篇自定义 CSS，同时不必放弃已有前端技术基线。
  - 这种分工更符合本次“替换组件库而非重写样式哲学”的目标。
- **备选方案**：
  - 完全改为 Mantine + CSS Modules，移除 Tailwind。
  - 该方案被拒绝，因为它超出了本次 change 的范围，也与当前技术方案中“保留 Tailwind CSS”相冲突。

### 决策 3：BlockNote 仅引入 Mantine 补充样式，避免重复加载核心样式

- **选择**：
  - 在全局已接入 `@mantine/core/styles.css` 的前提下，`packages/editor` 改为引入 `@blocknote/mantine/blocknoteStyles.css`，不再引入 `@blocknote/mantine/style.css`。
- **理由**：
  - BlockNote 官方 Mantine 文档明确区分了“含 Mantine 核心样式的完整入口”和“仅补充 BlockNote 样式的入口”。
  - 当前项目计划在 `apps/web` 入口全局启用 Mantine，因此继续在编辑器包里引入 `style.css` 会重复注入 Mantine 核心样式，增加样式冲突和重复体积风险。
  - 将 Mantine 样式的主入口放在应用层、将 BlockNote 补充样式放在编辑器层，可以清晰划分职责。
- **备选方案**：
  - 保持 `@blocknote/mantine/style.css` 不变。
  - 该方案被拒绝，因为它与官方“应用已使用 Mantine 时避免重复样式加载”的指导相冲突。

### 决策 4：优先替换当前页面交互组件，而不是先抽象新的自定义设计系统

- **选择**：
  - 这次先将当前 `OverviewPage`、`SpacePage`、`DocumentPage`、导航壳层和反馈提示替换为 Mantine 等价组件，并保留必要的页面级 CSS 结构。
- **理由**：
  - 当前 `apps/web` 的样式资产主要是页面壳层级 CSS，而不是成熟的共享 UI 抽象。直接替换现有页面交互组件可以最快完成统一基线。
  - 如果现在额外引入新的自定义组件封装层，容易把本次范围从“技术栈切换”膨胀为“设计系统建设”。
- **备选方案**：
  - 先创建一层新的 `components/ui` 封装，再逐页迁移。
  - 该方案被拒绝，因为它增加了额外抽象成本，而当前页面数量和交互复杂度都还不高。

## 风险与权衡

- 风险：Mantine Provider 接入后，当前页面 CSS 可能与 Mantine 默认样式出现层叠关系变化。
  - 缓解措施：保留页面结构类名，只把交互组件替换为 Mantine，并在 `index.css` 中收口全局变量与基础布局规则。
- 风险：Tailwind 与 Mantine 共存时，如果职责不清，后续仍可能出现组件样式分裂。
  - 缓解措施：在文档和实现中明确“组件用 Mantine、布局和少量修饰用 Tailwind”的边界。
- 风险：编辑器样式入口改动后，若没有按官方方式加载，可能出现 BlockNote 工具栏或正文样式缺失。
  - 缓解措施：严格按官方 Mantine 文档拆分 `@mantine/core/styles.css` 与 `@blocknote/mantine/blocknoteStyles.css` 的引入位置。

## 迁移计划

- 上线步骤：
  - 先更新决策文档与路线图，固定 Mantine 作为正式方案
  - 在 `apps/web` 入口接入 Mantine Provider 与核心样式
  - 替换当前产品壳层中的按钮、表单、布局与提示组件
  - 在 `packages/editor` 中切换 BlockNote 的样式导入策略
  - 运行前端类型检查与构建，确认文档页编辑器与元数据交互仍可用
- 回滚步骤：
  - 如 Mantine 接入导致页面样式或编辑器样式出现不可接受的回归，则先回退 `apps/web` Provider 与页面组件替换，同时恢复原有编辑器样式入口，再重新评估局部迁移策略
