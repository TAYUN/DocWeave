# Frontend Route Architecture Guide

本文档用于约定 `apps/web` 的前端路由拆分方式、页面代码组织边界，以及当前可维护结构下的继续演进约束。

它服务的是前端实现架构，不负责页面视觉规格、组件封装或产品级页面定义。

## 文件索引

| 文档                                                                                       | 职责                                                 |
| ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| [`../ui/page-inventory.md`](../ui/page-inventory.md)                                       | 页面清单、页面树、导航流转、优先级和跨页面一致性约定 |
| [`../ui/pages/`](../ui/pages/)                                                             | 单页规格，定义每个页面的目标、分区、状态和约束       |
| [`../../DESIGN.md`](../../DESIGN.md)                                                       | 视觉语言和设计规范                                   |
| [`./frontend-mantine-implementation-guide.md`](./frontend-mantine-implementation-guide.md) | `Mantine` 默认主题下的实现规范                       |
| [`./frontend-adonis-api-client-guide.md`](./frontend-adonis-api-client-guide.md)           | `apps/web` 与 `apps/api` 的类型安全 API 调用约定     |
| 本文档                                                                                     | 路由分层、目录树、页面模块迁移和 AI 实现约束         |

## 适用边界

- 适用：TanStack Router 的路由拆分、Layout 分层、页面目录规划、页面模块落点、后续 AI 实现约束。
- 不适用：页面视觉样式、交互文案、单页信息层级。这些内容应回到页面规格和设计文档。

## 当前状态说明

当前 `apps/web` 已经完成第一轮路由拆分，不再处于“单文件 `router.tsx` 迁移中”的阶段。

当前真实结构已经是：

1. `router/index.tsx` 负责组装 `routeTree`
2. `router/layouts/*` 承载 `RootLayout`、`PublicLayout`、`AppLayout`
3. `router/routes/**/*` 承载 `createRoute`、`beforeLoad` 等路由定义
4. `pages/*` 承载页面编排
5. `features/*` 承载业务区块

因此，本文档后续内容应理解为：

1. 对当前结构的维护约束
2. 对后续新增页面和新增子路由的接入规则
3. 对仍未落地页面的目标代码树参考

而不是再把当前实现当作“尚未开始拆分”的迁移对象。

## 规划原则

- **保留当前 URL 语义**：本轮 UI 重构继续使用现有页面规格里的 `/`、`/spaces/:spaceId`、`/documents/:documentId`、`/search`、`/chat`、`/ai`。不建议在只做 UI 重构时同时改成 `/home`、`/s/:spaceSlug`、`/s/:spaceSlug/d/:docId`，否则会把视觉改造和信息架构迁移耦在一起。
- **TanStack Router 只做路由装配**：`createRoute`、`beforeLoad`、`loader`、`errorComponent` 放在路由模块；页面 JSX、表单状态、查询细节不要继续放在总路由文件里。
- **Layout 单独成层**：公开页、登录后工作台、设置区、公开分享区分别拥有自己的 Layout 文件，不把 Header、Sidebar、权限守卫判断分散到每个页面。
- **页面负责组装，业务区块继续下沉**：页面层只负责区块排序和页面级状态；如空间树、创建空间表单、创建文档表单、文档编辑面板、AI 状态卡等，应该落到 `features/*`。
- **先拆模块，再决定是否切文件路由**：当前项目已经使用 TanStack Router 代码式建树，先把模块边界拆干净即可；没有必要为了“拆文件”立刻引入新的路由生成方案。
- **公开页也必须有 Layout**：`PublicLayout` 虽然不显示 Sidebar，但它仍然是公开页的统一壳层；不允许把登录页之类的公开页重新做成“无 layout 特判页”。

## 当前已落地 URL 页面树

当前代码事实已经落地的页面树如下：

```text
RootLayout
├── PublicLayout
│   └── /login
└── AppLayout
    ├── /
    ├── /spaces/:spaceId
    └── /documents/:documentId
```

当前对应文件包括：

1. `router/layouts/root-layout.tsx`
2. `router/layouts/public-layout.tsx`
3. `router/layouts/app-layout.tsx`
4. `router/routes/public/login.route.tsx`
5. `router/routes/app/home.route.tsx`
6. `router/routes/app/spaces/space-detail.route.tsx`
7. `router/routes/app/documents/document-editor.route.tsx`

## 目标 URL 页面树

下面这棵树表示“后续扩展时建议遵守的目标组织”，不是当前已全部实现的事实：

```text
RootLayout
├── PublicLayout
│   ├── /login
│   ├── /register
│   ├── /forgot-password
│   └── /invite/:token
├── AppLayout
│   ├── /
│   ├── /spaces/:spaceId
│   ├── /documents/:documentId
│   ├── /search
│   ├── /chat
│   ├── /chat/:chatId              （预留：问答历史）
│   ├── /ai
│   ├── /trash
│   ├── /favorites
│   └── /settings
│       ├── /settings/account
│       ├── /settings/profile
│       ├── /settings/workspace
│       ├── /settings/members
│       ├── /settings/spaces
│       ├── /settings/ai
│       ├── /settings/rag
│       └── /settings/security
└── ShareLayout
    └── /share/:shareId/d/:docId
```

补充约定：

- `/` 继续作为工作台首页，不单独新增 `/home`。
- `/login`、`/register`、`/forgot-password`、`/invite/:token` 统一挂在 `PublicLayout` 下；“公开页不显示 Sidebar”不等于“公开页不需要 layout 文件”。
- 现阶段不单独新增 `/spaces` 总览页。当前工作台首页已经承担“空间列表 + 最近文档”的入口职责，等信息架构明确需要独立“空间发现页”时再补。
- `/documents/:documentId` 继续保持顶层详情路由，而不是强行嵌到 `/spaces/:spaceId/*` 下。这样更符合当前后端以 `documentId` 直取详情的接口事实，也更利于直达、分享和后续协同深链。
- `/chat/:chatId` 建议只作为未来扩展位保留，在对话持久化、历史列表和恢复会话需求明确前，不要先做假嵌套路由。

## 当前已落地代码树

当前 `apps/web/src` 的主要结构已经是：

```text
apps/web/src
├── router/
│   ├── index.tsx
│   ├── layouts/
│   │   ├── root-layout.tsx
│   │   ├── public-layout.tsx
│   │   └── app-layout.tsx
│   └── routes/
│       ├── public/
│       │   ├── public-layout.route.tsx
│       │   └── login.route.tsx
│       └── app/
│           ├── app-layout.route.tsx
│           ├── home.route.tsx
│           ├── spaces/
│           │   └── space-detail.route.tsx
│           └── documents/
│               └── document-editor.route.tsx
├── pages/
│   ├── auth/
│   │   └── login-page.tsx
│   ├── workbench/
│   │   └── workbench-home-page.tsx
│   ├── spaces/
│   │   └── space-detail-page.tsx
│   └── documents/
│       └── document-editor-page.tsx
├── features/
│   ├── shell/
│   ├── spaces/
│   ├── documents/
│   └── shared/
└── lib/
    ├── api.ts
    ├── auth.ts
    ├── tuyau-client.ts
    └── workspace-data.ts
```

## 目标代码树

下面这棵树表示后续扩展页面继续接入时的推荐方向，不代表当前仓库已经全部实现：

```text
apps/web/src
├── router/
│   ├── index.tsx
│   ├── layouts/
│   │   ├── root-layout.tsx
│   │   ├── public-layout.tsx
│   │   ├── app-layout.tsx
│   │   ├── settings-layout.tsx
│   │   └── share-layout.tsx
│   └── routes/
│       ├── public/
│       │   ├── login.route.tsx
│       │   ├── register.route.tsx
│       │   ├── forgot-password.route.tsx
│       │   └── invite.route.tsx
│       ├── app/
│       │   ├── home.route.tsx
│       │   ├── search.route.tsx
│       │   ├── chat.route.tsx
│       │   ├── chat-detail.route.tsx
│       │   ├── ai.route.tsx
│       │   ├── trash.route.tsx
│       │   ├── favorites.route.tsx
│       │   ├── spaces/
│       │   │   └── space-detail.route.tsx
│       │   ├── documents/
│       │   │   └── document-editor.route.tsx
│       │   └── settings/
│       │       ├── index.route.tsx
│       │       ├── account.route.tsx
│       │       ├── profile.route.tsx
│       │       ├── workspace.route.tsx
│       │       ├── members.route.tsx
│       │       ├── spaces.route.tsx
│       │       ├── ai.route.tsx
│       │       ├── rag.route.tsx
│       │       └── security.route.tsx
│       └── shared/
│           └── share-document.route.tsx
├── pages/
│   ├── auth/
│   │   ├── login-page.tsx
│   │   ├── register-page.tsx
│   │   ├── forgot-password-page.tsx
│   │   └── invite-page.tsx
│   ├── workbench/
│   │   └── workbench-home-page.tsx
│   ├── spaces/
│   │   └── space-detail-page.tsx
│   ├── documents/
│   │   └── document-editor-page.tsx
│   ├── search/
│   │   └── search-page.tsx
│   ├── chat/
│   │   ├── rag-chat-page.tsx
│   │   └── rag-chat-detail-page.tsx
│   ├── ai/
│   │   └── ai-assistant-page.tsx
│   ├── settings/
│   │   ├── settings-index-page.tsx
│   │   ├── account-settings-page.tsx
│   │   ├── profile-settings-page.tsx
│   │   ├── workspace-settings-page.tsx
│   │   ├── members-settings-page.tsx
│   │   ├── spaces-settings-page.tsx
│   │   ├── ai-settings-page.tsx
│   │   ├── rag-settings-page.tsx
│   │   └── security-settings-page.tsx
│   └── shared/
│       └── shared-document-page.tsx
├── features/
│   ├── shell/
│   ├── auth/
│   ├── spaces/
│   ├── documents/
│   ├── search/
│   ├── chat/
│   ├── ai/
│   └── settings/
└── lib/
    ├── api.ts
    ├── auth.ts
    └── tuyau-client.ts
```

## 路由层与页面层职责边界

| 层级                           | 应负责                                                   | 不应负责                           |
| ------------------------------ | -------------------------------------------------------- | ---------------------------------- |
| `router/index.tsx`             | 创建 `router`、注册 `routeTree`                          | 页面 JSX、查询逻辑、表单状态       |
| `router/layouts/*.tsx`         | `Outlet`、壳层布局、公共守卫、公共错误边界               | 具体页面业务区块                   |
| `router/routes/**/*.route.tsx` | `path`、参数声明、`beforeLoad`、`loader`、路由级错误处理 | 大块页面 UI、长表单、复杂 mutation |
| `pages/**/*.tsx`               | 页面区块编排、页面级标题、空态、错误态                   | `createRoute`、全局路由装配        |
| `features/**/*.tsx`            | 业务区块、数据查询、表单和交互流程                       | 全局布局职责                       |

## 数据与守卫归属硬规则

- 登录态重定向、权限守卫、`beforeLoad`、路由级 `loader` 一律放在 `router/routes/**/*.route.tsx` 或 `router/layouts/*.tsx`。
- `current-user`、全局导航所需空间列表、Sidebar 所需空间树这类“导航级必需数据”，优先由 `AppLayout` 或对应 route 统一持有；页面不允许自行兼任守卫壳层。
- 只有页面私有的数据和交互，才下沉到 `pages/*` 或 `features/*` 中的 query / mutation。
- 不允许让单个页面文件同时承担：登录态守卫、全局导航数据、页面主体查询、表单交互和区块拼装。
- `PublicLayout` 可以是极轻量壳层，但必须存在，用来统一公开页的结构、重定向和错误边界。

## 当前三大页面的 feature 拆分清单

### WorkbenchHome

- `features/shell/app-header/*`：顶栏品牌、搜索入口、新建入口、用户菜单
- `features/spaces/create-space-modal.tsx`：创建空间入口、弹窗与提交状态
- `features/spaces/space-overview-grid.tsx`：空间概览卡片与最近文档入口
- `features/spaces/space-list.tsx`：空间列表
- `features/documents/recent-document-list.tsx`：最近文档列表

### SpacePage

- `features/spaces/space-summary-card/*`：空间名称、简介、元数据
- `features/documents/create-document-form.tsx`：创建文档表单
- `features/documents/document-directory-list.tsx`：空间内文档目录
- `features/spaces/lib/space-view-model.ts`：空间摘要、文档数与最近文档排序等页面友好字段

### DocumentPage

- `features/documents/document-status-bar.tsx`：文档状态栏
- `features/documents/document-meta-panel.tsx`：标题、摘要和元信息相关区块
- `features/documents/document-editor-panel.tsx`：BlockNote 编辑器面板
- `features/documents/lib/document-view-model.ts`：状态文案、时间、内容解析等展示友好字段

说明：

- 以上清单是当前三大页面的最小推荐切块，不要求一步到位全部实现独立文件，但后续拆分时应沿这个方向推进。
- 如果某块暂时不抽成独立组件，也应在页面文件内先按相同职责分段，避免继续堆成单一大组件。

## 已完成的拆分结果

当前已经完成的关键拆分包括：

1. `RootLayout` 已落到 `router/layouts/root-layout.tsx`
2. 公开页壳层与重定向逻辑已落到 `router/layouts/public-layout.tsx` + `router/routes/public/*.route.tsx`
3. `AppLayout` 已承载登录态守卫、导航级数据与工作台壳层
4. `LoginPage`、`WorkbenchHomePage`、`SpaceDetailPage`、`DocumentEditorPage` 已落到 `pages/*`
5. 文档与空间相关纯函数、view-model 与展示转换已下沉到 `features/*/lib`
6. 顶层 `createRoute(...)` 定义已收口到 `router/routes/**/*.route.tsx`

后续重点不再是“把 `router.tsx` 拆掉”，而是：

1. 新页面继续按相同边界接入
2. 已有页面继续把过大的 page 内逻辑下沉到 `features/*`
3. 新增子路由时继续保持 route / page / feature 不串层

## 对 AI 实现的约束

- 不允许新增页面时直接修改一个超大 `router.tsx` 来同时放路由定义、布局组件和页面实现。
- 一个路由文件只定义一条路由或一组很小的同层子路由，不内联完整页面。
- 公开页必须统一挂到 `PublicLayout`，不允许因为“没有 Sidebar”就回退到无 layout 特判。
- `AppLayout` 负责 Header、Sidebar、`Outlet` 和登录态守卫；工作台首页、空间详情页、文档页都只消费这个壳层，不重复造壳。
- `AppLayout` 或对应 route 负责认证与导航级必需数据；页面不允许自己兼任全局守卫壳层。
- `Settings` 必须从一开始就按子路由拆分，即使当前先做占位页，也不要继续维持一个“万能 settings 页面”。
- `WorkbenchHome`、`SpacePage`、`DocumentPage` 不允许只是从 `router.tsx` 挪到 `pages/*` 后继续维持超大单文件，应按上面的 feature 清单继续拆块。
- 搜索、RAG 问答、AI 助手三者保持独立页面边界：`/search` 负责检索，`/chat` 负责问答，`/ai` 负责能力入口和最近动作，不互相吞并。
