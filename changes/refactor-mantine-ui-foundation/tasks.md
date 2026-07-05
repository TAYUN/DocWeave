# 实现任务

## 文件结构

- `Modify: docs/decisions/01. 最终技术方案确认.md` — 将正式技术方案中的产品 UI 与 BlockNote 适配基线更新为 Mantine 体系。
- `Modify: docs/planning/00. 当前实施路线图.md` — 将路线图中的前端组件栈与编辑器接入描述更新为 Mantine 方向。
- `Modify: apps/web/package.json` — 增加 Mantine 相关依赖并保持现有 React、TanStack 与工作区依赖边界。
- `Modify: apps/web/src/main.tsx` — 在前端入口挂载 `MantineProvider`、Mantine 核心样式与通知容器。
- `Modify: apps/web/src/index.css` — 收口 Mantine 兼容的全局变量、基础布局规则与 Tailwind 指令入口。
- `Modify: apps/web/src/App.css` — 将页面级布局样式收敛为与 Mantine 组件共存的壳层样式。
- `Modify: apps/web/src/router.tsx` — 将 Overview、Space、Document 页面中的交互组件替换为 Mantine 等价组件，同时保持现有 Query/Mutation 逻辑。
- `Modify: packages/editor/package.json` — 确认共享编辑器保留 `@blocknote/mantine` 与 Mantine 适配依赖，不引入 `@blocknote/shadcn`。
- `Modify: packages/editor/src/document-editor.tsx` — 将 BlockNote Mantine 样式入口切换为 `blocknoteStyles.css`，并保持现有编辑器 props 契约不变。

## 接口

### App Bootstrap

- **Consumes**: `QueryClient` from `@tanstack/react-query`
- **Consumes**: `router` from `apps/web/src/router.tsx`
- **Produces**: `ReactElement` tree wrapped by `MantineProvider`, `QueryClientProvider`, and `RouterProvider`

### Web Data Contracts

- **Consumes**: `createSpace(input: { name: string; summary: string }): Promise<ApiSpace>`
- **Consumes**: `createDocument(input: { spaceId: string; title: string; summary: string }): Promise<ApiDocument>`
- **Consumes**: `updateDocument(input: { documentId: string; title?: string; summary?: string; content?: string }): Promise<ApiDocument>`
- **Produces**: unchanged query and mutation call sites in `apps/web/src/router.tsx`

### Shared Editor Boundary

- **Consumes**: `DocumentEditorProps = { initialContent: DocumentEditorContent; editable?: boolean; onChange: (content: DocumentEditorContent) => void }`
- **Consumes**: `DocumentEditorContent = PartialBlock[]`
- **Produces**: unchanged `DocumentEditor` export from `packages/editor/src/index.ts`

## 1. Batch 1: 固化 Mantine 技术方案文档

Depends on: None

### Interfaces

- **Consumes**: decision and planning wording in `docs/decisions/01. 最终技术方案确认.md` and `docs/planning/00. 当前实施路线图.md`
- **Produces**: Mantine-aligned technical baseline text for product UI and BlockNote adapter selection

- [x] **1.1 编写失败检查**

```text
人工检查当前决策文档仍写有 `shadcn/ui` 与 `@blocknote/shadcn`，确认文档基线尚未对齐本次 change。
```

- [x] **1.2 运行失败检查**

Run:
- `git diff -- "docs/decisions/01. 最终技术方案确认.md" "docs/planning/00. 当前实施路线图.md"`

Expected:
- 两份文档尚未体现 Mantine 作为正式产品 UI 基线

- [x] **1.3 实现最小化代码**

```text
修改以下文件：
- docs/decisions/01. 最终技术方案确认.md
- docs/planning/00. 当前实施路线图.md

将产品 UI 组件库更新为 `@mantine/core + @mantine/hooks + @mantine/notifications`，
将编辑器 UI 适配层更新为 `@blocknote/mantine`，
并明确 Tailwind CSS 继续保留为布局与工具类样式方案。
```

- [x] **1.4 运行通过检查**

Run:
- `ssf validate "changes/refactor-mantine-ui-foundation"`

Expected:
- 规划工件仍然通过校验

- [x] **1.5 记录结果**

```text
人工复核两份文档中的技术栈清单、补充说明与阶段描述，确认不再出现 `shadcn/ui` 或 `@blocknote/shadcn` 作为正式基线。
```

## 2. Batch 2: 建立 apps/web 的 Mantine 入口与全局样式基线

Depends on: Batch 1

### Interfaces

- **Consumes**: `apps/web/package.json`, `apps/web/src/main.tsx`, `apps/web/src/index.css`
- **Produces**: Mantine-enabled frontend bootstrap with unchanged `QueryClientProvider` and `RouterProvider`

- [x] **2.1 编写失败检查**

```text
人工检查当前 apps/web 入口没有 `MantineProvider`，也没有 Mantine 核心样式入口。
```

- [x] **2.2 运行失败检查**

Run:
- `pnpm typecheck:web`

Expected:
- 当前前端能通过类型检查，但仍未具备 Mantine Provider 和依赖基线

- [x] **2.3 实现最小化代码**

```text
修改以下文件：
- apps/web/package.json
- apps/web/src/main.tsx
- apps/web/src/index.css

具体动作：
- 增加 `@mantine/core`、`@mantine/hooks`、`@mantine/notifications`、`@mantine/utils`
- 在入口导入 `@mantine/core/styles.css`
- 使用 `MantineProvider` 包裹现有应用树
- 接入 `Notifications`
- 在 `index.css` 中保留 Tailwind 指令，并收口 Mantine 兼容的全局变量与基础布局规则
```

- [x] **2.4 运行通过检查**

Run:
- `pnpm typecheck:web`

Expected:
- PASS

- [x] **2.5 记录结果**

```text
人工确认 `QueryClientProvider`、`RouterProvider` 仍保留在入口树中，Mantine 只增加组件与样式基线，不改路由和数据流。
```

## 3. Batch 3: 将产品页面交互组件切换到 Mantine

Depends on: Batch 2

### Interfaces

- **Consumes**: `WorkspaceStage`, `DocumentEditor`, `createSpace`, `createDocument`, `updateDocument`
- **Produces**: unchanged route-level data flow with Mantine UI components in `apps/web/src/router.tsx`

- [x] **3.1 编写失败检查**

```text
人工检查当前页面仍使用原生 `button`、`input`、`textarea` 和自定义提示块，尚未统一到 Mantine 组件体系。
```

- [x] **3.2 运行失败检查**

Run:
- `pnpm build:web`

Expected:
- 当前构建可通过，但页面交互层仍是自定义 CSS + 原生控件组合

- [x] **3.3 实现最小化代码**

```text
修改以下文件：
- apps/web/src/router.tsx
- apps/web/src/App.css

具体动作：
- 使用 Mantine 的布局、表单、按钮、卡片、提示与徽标组件替换当前页面交互组件
- 保留现有 `useSuspenseQuery`、`useMutation`、`invalidateQueries` 与路由结构
- 保留现有页面文案、字段含义与提交路径
- 将页面级 CSS 收敛为壳层布局、间距和少量视觉补充，不继续承担主要交互组件样式职责
```

- [x] **3.4 运行通过检查**

Run:
- `pnpm typecheck:web`
- `pnpm build:web`

Expected:
- PASS

- [x] **3.5 记录结果**

```text
人工确认 Overview、Space、Document 三个页面仍能完成创建空间、创建文档、编辑文档并保存的现有行为，只变化组件呈现方式。
```

## 4. Batch 4: 对齐 BlockNote Mantine 样式入口并完成最终验收

Depends on: Batch 3

### Interfaces

- **Consumes**: `DocumentEditorProps`, `DocumentEditorContent`, `BlockNoteView`, Mantine global styles from `apps/web/src/main.tsx`
- **Produces**: shared editor package aligned with BlockNote Mantine guidance and unchanged document save callback contract

- [x] **4.1 编写失败检查**

```text
人工检查当前共享编辑器仍导入 `@blocknote/mantine/style.css`，存在重复引入 Mantine 核心样式的风险。
```

- [x] **4.2 运行失败检查**

Run:
- `pnpm typecheck:web`

Expected:
- 当前类型检查可通过，但编辑器样式入口仍未按官方 Mantine 指南拆分

- [x] **4.3 实现最小化代码**

```text
修改以下文件：
- packages/editor/package.json
- packages/editor/src/document-editor.tsx

具体动作：
- 确认共享编辑器继续依赖 `@blocknote/core`、`@blocknote/react`、`@blocknote/mantine`
- 保持 `DocumentEditorProps` 与 `DocumentEditorContent` 不变
- 将样式导入从 `@blocknote/mantine/style.css` 切换为 `@blocknote/mantine/blocknoteStyles.css`
- 不引入 `@blocknote/shadcn`
```

- [x] **4.4 运行通过检查**

Run:
- `pnpm typecheck:web`
- `pnpm build:web`
- `pnpm check:workspace`

Expected:
- PASS

- [x] **4.5 记录结果**

```text
人工确认文档页编辑器仍能渲染、输入和提交保存，且本次 change 没有改动协同、Yjs、Hocuspocus 或 API 业务逻辑。
```
