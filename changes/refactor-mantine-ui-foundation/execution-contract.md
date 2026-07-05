# 执行合同

## Intent Lock

- **变更名称**：`refactor-mantine-ui-foundation`
- **要解决的问题**：
  - 当前正式技术文档仍将产品 UI 基线写为 `shadcn/ui`，并将编辑器适配层写为 `@blocknote/shadcn`，但仓库实际已经在共享编辑器中使用 `@blocknote/mantine`。
  - `apps/web` 目前也尚未形成真正的 `shadcn/ui` 组件体系，继续沿用旧文档基线会让产品 UI、编辑器 UI 和实施方向长期不一致。
  - 本次 change 需要把产品 UI 和 BlockNote 编辑器 UI 共同统一到 Mantine，同时保留现有 React SPA、TanStack 与 Tailwind 技术基线。
- **范围内**：
  - 更新 `docs/decisions/01. 最终技术方案确认.md` 与 `docs/planning/00. 当前实施路线图.md`，明确 Mantine 为正式产品 UI 基线，`@blocknote/mantine` 为正式编辑器适配层。
  - 在 `apps/web` 中引入 Mantine 依赖、`MantineProvider`、Mantine 核心样式和通知容器。
  - 将当前产品壳层和页面交互组件替换为 Mantine 等价组件，同时保持现有 Query/Mutation 与路由行为不变。
  - 在 `packages/editor` 中保留 `@blocknote/mantine` 适配，并将样式入口切换为 `@blocknote/mantine/blocknoteStyles.css`。
- **范围外**：
  - 不调整 `React SPA`、`Vite`、`TanStack Router`、`TanStack Query` 的整体架构。
  - 不改变创建空间、创建文档、编辑文档与保存正文的业务逻辑与 API 协议。
  - 不修改协同、Yjs、Hocuspocus、collab token、WebSocket、AI、RAG、导出或快照相关代码。
  - 不开展新的品牌系统重构、复杂主题系统建设或跨端视觉重做。

## Approved Behavior

- **已批准需求摘要**：
  - `apps/web` 必须以 Mantine 作为正式产品 UI 组件基线，并在入口中挂载 `MantineProvider`。
  - `apps/web` 必须保留 Tailwind CSS，用于布局和工具类样式，而不是把 Tailwind 一并移除。
  - `docs/decisions` 与 `docs/planning` 必须明确 Mantine 为产品 UI 基线，`@blocknote/mantine` 为编辑器 UI 适配层。
  - `packages/editor` 必须依赖 `@blocknote/core + @blocknote/react + @blocknote/mantine`，且不得引入 `@blocknote/shadcn`。
  - 当应用已全局启用 Mantine 时，BlockNote 样式必须使用 `@blocknote/mantine/blocknoteStyles.css`，不得继续使用 `@blocknote/mantine/style.css`。
  - `OverviewPage`、`SpacePage`、`DocumentPage` 的交互组件必须切换到 Mantine，但现有创建空间、创建文档、编辑文档和保存正文的行为必须保持可达。
  - `DocumentEditor` 的 `initialContent / editable / onChange` 契约必须保持不变，正文保存路径仍通过现有 update mutation 流转。
- **关键场景**：
  - 开发者检查前端入口时，能看到 `MantineProvider`、Mantine 核心样式和保留的 `QueryClientProvider` / `RouterProvider`。
  - 开发者检查决策文档和路线图时，不再看到 `shadcn/ui` 或 `@blocknote/shadcn` 被描述为正式基线。
  - 用户在 Overview、Space、Document 页面上的创建与保存操作仍按原路径运行，但交互组件呈现为 Mantine 体系。
  - 用户打开文档页时，仍能看到可用的 `DocumentEditor`，编辑正文并保存后，行为与当前单人编辑基线一致。
- **验收检查**：
  - `pnpm typecheck:web` 通过。
  - `pnpm build:web` 通过。
  - `pnpm check:workspace` 通过。
  - 人工检查确认文档、前端入口、页面交互和 BlockNote 样式入口均符合 Mantine 方案。

## Design Constraints

- **架构约束**：
  - 产品 UI 与编辑器 UI 必须统一到同一套 Mantine 组件生态，避免继续维持两套正式基线。
  - Mantine 只替换组件与样式基线，不得改动现有 Query、Mutation、路由或 API 行为。
  - 当前 change 仍然是 UI 基线切换，不得顺带扩展到协同、AI、RAG、导出或快照能力。
- **接口约束**：
  - `apps/web/src/main.tsx` 必须继续保留 `QueryClientProvider` 与 `RouterProvider`。
  - `apps/web/src/router.tsx` 中 `createSpace`、`createDocument`、`updateDocument` 的调用路径必须保持不变。
  - `packages/editor/src/index.ts` 与 `DocumentEditorProps` / `DocumentEditorContent` 导出契约必须保持兼容。
- **依赖约束**：
  - `apps/web` 需要新增 `@mantine/core`、`@mantine/hooks`、`@mantine/notifications`、`@mantine/utils`。
  - `packages/editor` 继续使用 `@blocknote/core`、`@blocknote/react`、`@blocknote/mantine` 与 Mantine 适配依赖。
  - 不得新增 `shadcn/ui` 或 `@blocknote/shadcn` 作为活跃依赖基线。
- **数据约束**：
  - 当前单人正文编辑数据结构与保存路径不应变化。
  - 本次变更不得引入新的 API 字段、数据模型或持久化语义。

## Task Batches

### Batch 1

- **目标**：固化 Mantine 技术方案文档。
- **输入**：`proposal.md`、`specs/`、当前决策文档与路线图文本。
- **输出**：与规划一致的 Mantine 技术方案描述。
- **完成标准**：
  - `docs/decisions/01. 最终技术方案确认.md` 与 `docs/planning/00. 当前实施路线图.md` 已更新。
  - 文档中不再把 `shadcn/ui` 或 `@blocknote/shadcn` 作为正式基线。
  - `ssf validate "changes/refactor-mantine-ui-foundation"` 通过。

### Batch 2

- **目标**：建立 `apps/web` 的 Mantine 入口与全局样式基线。
- **输入**：Batch 1 的文档基线、当前 `apps/web/package.json`、`main.tsx`、`index.css`。
- **输出**：带 Mantine Provider、Mantine 核心样式与通知容器的前端入口。
- **完成标准**：
  - `apps/web/package.json` 含 Mantine 依赖。
  - `apps/web/src/main.tsx` 挂载 `MantineProvider`，并保留 `QueryClientProvider`、`RouterProvider`。
  - `apps/web/src/index.css` 保留 Tailwind 指令并转换为 Mantine 兼容的全局样式入口。
  - `pnpm typecheck:web` 通过。

### Batch 3

- **目标**：将产品页面交互组件切换到 Mantine。
- **输入**：Batch 2 的应用入口、当前 `apps/web/src/router.tsx`、`apps/web/src/App.css`。
- **输出**：Mantine 化的工作台、空间页和文档页交互层。
- **完成标准**：
  - Overview、Space、Document 页面交互组件使用 Mantine 等价组件。
  - 现有 `useSuspenseQuery`、`useMutation`、`invalidateQueries` 与路由结构保持不变。
  - `pnpm typecheck:web` 与 `pnpm build:web` 通过。

### Batch 4

- **目标**：对齐 BlockNote Mantine 样式入口并完成验收。
- **输入**：Batch 3 的全局 Mantine 样式环境、当前 `packages/editor` 编辑器实现。
- **输出**：符合 BlockNote Mantine 官方指导的共享编辑器样式入口。
- **完成标准**：
  - `packages/editor/src/document-editor.tsx` 使用 `@blocknote/mantine/blocknoteStyles.css`。
  - `DocumentEditorProps`、`DocumentEditorContent` 和 `onChange` 保存链路保持兼容。
  - `pnpm typecheck:web`、`pnpm build:web`、`pnpm check:workspace` 通过。
  - 人工确认文档页编辑器仍可渲染、输入与保存。

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 当前文档若仍把 `shadcn/ui` 与 `@blocknote/shadcn` 写为正式基线，应视为方案未完成对齐。
  - 当前前端入口若没有 `MantineProvider` 与 Mantine 核心样式入口，应视为产品 UI 基线未切换。
  - 当前页面若仍主要依赖原生按钮、输入框与自定义提示块，应视为 Mantine 页面交互替换未完成。
  - 当前共享编辑器若仍导入 `@blocknote/mantine/style.css`，应视为 BlockNote Mantine 样式入口未完成对齐。
- **必需的边界情况**：
  - 必须保留 Tailwind CSS，不得把“切到 Mantine”扩展成“移除 Tailwind”。
  - 必须保持 `createSpace`、`createDocument`、`updateDocument` 的业务路径与单人编辑行为稳定。
  - 必须避免在全局已启用 Mantine 的情况下重复引入 Mantine 核心样式。
  - 必须不触碰协同、Yjs、Hocuspocus、AI、RAG 与 API 数据语义。
- **回归敏感区域**：
  - `docs/decisions/01. 最终技术方案确认.md`
  - `docs/planning/00. 当前实施路线图.md`
  - `apps/web/package.json`
  - `apps/web/src/main.tsx`
  - `apps/web/src/index.css`
  - `apps/web/src/App.css`
  - `apps/web/src/router.tsx`
  - `packages/editor/package.json`
  - `packages/editor/src/document-editor.tsx`

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这次 change 天然分为“文档基线 -> 前端入口 -> 页面组件 -> 编辑器样式对齐”四个连续批次，每一批都有清晰完成标准。
  - 当前改动跨文档、前端入口和共享编辑器，但没有引入新的数据模型或后端协议，按批次顺序推进最稳妥。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 待确认文档、前端入口、页面组件与编辑器样式入口四类改动都已落地 |
| Correctness | Pending | 待确认 Mantine 接入、Tailwind 保留策略与 BlockNote 样式入口均符合合同与官方指导 |
| Coherence | Pending | 待确认产品 UI、编辑器 UI 与技术文档不再出现基线分裂 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 后审查文档基线是否已经完整切到 Mantine。
  - Batch 2 后审查 Mantine Provider、Mantine 核心样式和 Tailwind 指令是否共存良好。
  - Batch 3 后审查页面交互组件是否已统一为 Mantine，且未破坏现有数据流。
  - Batch 4 后审查 BlockNote 样式入口是否按官方 Mantine 指南拆分，并确认单人编辑行为未回归。
- **阻塞类别**：
  - 实现试图移除 Tailwind、引入新的 `shadcn/ui` 基线或恢复 `@blocknote/shadcn`。
  - 实现试图修改 API 业务逻辑、协同代码或单人编辑保存链路。
  - 页面组件替换后造成现有创建、保存或编辑流程不可用。
  - BlockNote 样式入口仍重复加载 Mantine 核心样式或导致编辑器不可用。

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果范围扩展为新的设计系统建设、复杂主题系统重构或移除 Tailwind。
  - 如果实施过程中发现必须修改 API 业务逻辑、数据模型或协同能力才能完成本次 UI 切换。
- **何时回退到 `bridging`**：
  - 如果 `proposal.md`、`specs/`、`design.md`、`tasks.md` 中任一项发生实质变更，导致当前合同不再准确。
  - 如果发现存在未映射 requirement、测试义务或批次边界缺口，需要重建合同。
- **何时不得继续实现**：
  - 用户未明确批准本执行合同。
  - 实现无法同时满足 Mantine 基线、Tailwind 保留和 BlockNote 样式去重这三项硬约束。
  - 实现需要超出本合同范围去触碰协同、AI、RAG、导出、快照或 API 语义。
