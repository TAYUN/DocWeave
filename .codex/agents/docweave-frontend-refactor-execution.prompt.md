# DocWeave 前端改造执行模板

这个模板用于让 AI 在 DocWeave 中执行前端页面重构、路由拆分或壳层改造时，严格遵守既定边界。

它不是评审模板，而是实施模板。  
评审时优先使用 [`docweave-frontend-architect.prompt.md`](./docweave-frontend-architect.prompt.md)。

## 使用前提

在使用这个模板前，AI 应先读取并遵守：

- [`../../docs/workflow/frontend-route-architecture.md`](../../docs/workflow/frontend-route-architecture.md)
- [`../../docs/ui/page-inventory.md`](../../docs/ui/page-inventory.md)
- [`../../docs/workflow/frontend-mantine-implementation-guide.md`](../../docs/workflow/frontend-mantine-implementation-guide.md)
- [`../../DESIGN.md`](../../DESIGN.md)

## 适用场景

- 拆分 `apps/web/src/router.tsx`
- 重构登录后工作台壳层
- 新增或改造 `WorkbenchHome`、`SpacePage`、`DocumentPage`
- 新增搜索、AI、设置等页面时，防止再次混写路由、布局、页面和业务区块

## 核心硬规则

### 路由与 layout

- 公开页必须统一挂到 `PublicLayout`，即使没有 Sidebar，也不能做成无 layout 特判。
- 已登录业务页必须统一挂到 `AppLayout`。
- `createRoute`、`beforeLoad`、`loader`、`errorComponent` 只放在 `router/routes/**/*.route.tsx`。
- `RootLayout`、`PublicLayout`、`AppLayout`、`ShareLayout` 只负责壳层、守卫、公共错误边界和 `Outlet`。

### 数据与守卫

- 登录态重定向、权限守卫、路由级必需数据，只能放在 route 或 layout。
- `current-user`、全局导航空间列表、Sidebar 空间树等导航级必需数据，优先由 `AppLayout` 或对应 route 统一持有。
- 页面不允许自行兼任守卫壳层。

### page 与 feature

- `pages/*` 只负责页面编排、页面级标题、空态、错误态和区块排序。
- `features/*` 承接业务区块、表单、局部 query / mutation 和复用交互。
- 不允许把大 `router.tsx` 直接变成大 `page.tsx`。

### 当前三大页面的最小切块

- `WorkbenchHome`
  - `features/spaces/create-space-form/*`
  - `features/spaces/space-list/*`
  - `features/documents/recent-document-list/*`
- `SpacePage`
  - `features/spaces/space-summary-card/*`
  - `features/documents/create-document-form/*`
  - `features/documents/document-list/*`
  - `features/spaces/space-switcher/*`
- `DocumentPage`
  - `features/documents/document-status-bar/*`
  - `features/documents/document-meta-form/*`
  - `features/documents/document-editor-panel/*`
  - `features/documents/document-actions/*`

## 标准执行模板

```text
请按 DocWeave 既定的前端实现架构执行这次改造，不要自由发挥新的目录组织。

开始前请先阅读并遵守：
- docs/workflow/frontend-route-architecture.md
- docs/ui/page-inventory.md
- docs/workflow/frontend-mantine-implementation-guide.md
- DESIGN.md

本次目标：
- <一句话目标>

本次改动范围：
- <文件或目录 1>
- <文件或目录 2>

执行要求：
- 公开页统一挂到 PublicLayout
- 已登录业务页统一挂到 AppLayout
- createRoute / beforeLoad / loader / errorComponent 只放 route 文件
- page 只做页面编排，feature 承接业务区块
- 不允许把 router.tsx 的大组件原样搬到 page 文件
- 如果涉及 WorkbenchHome / SpacePage / DocumentPage，按既定 feature 清单继续拆块
- 如果发现文档边界和当前实现冲突，先指出冲突，再做最小收口，不要私自发明第三套结构

请按下面方式工作：
1. 先用 3 到 6 条说明你将如何拆分
2. 再实际修改代码
3. 完成后汇报：
   - 改了哪些文件
   - 路由层、layout 层、page 层、feature 层分别承担了什么
   - 是否还有未拆完但已明确预留的耦合点
```

## 拆 `router.tsx` 专用模板

```text
请按 DocWeave 的前端路由架构，把 apps/web/src/router.tsx 拆分为 router / layouts / routes / pages / features 结构。

硬要求：
- 不保留新的万能 router 文件
- PublicLayout 必须落地
- AppLayout 持有登录态守卫与导航级必需数据
- WorkbenchHome / SpacePage / DocumentPage 不能只是换文件名，必须继续按 feature 拆块
- 所有中文注释保持简洁，优先解释边界和为什么这样拆

完成后请说明：
- 哪些职责从 router.tsx 移到了 layout
- 哪些职责移到了 route
- 哪些职责移到了 page
- 哪些职责移到了 feature
- 还剩哪些后续可继续拆分的点
```

## 新页面接入模板

```text
请在 DocWeave 现有前端架构下接入一个新页面，不要直接把实现塞进 router.tsx 或万能 page 文件。

新页面：
- 名称：<页面名>
- 路由：<路由>
- 所属 layout：<PublicLayout / AppLayout / ShareLayout>

要求：
- route 文件只定义路由与守卫
- page 文件只做页面编排
- 可复用业务块下沉到 features
- 遵守 docs/ui/page-inventory.md 的页面边界

如果当前页面规格不完整，请先指出缺口，再按最小合理结构接入。
```
