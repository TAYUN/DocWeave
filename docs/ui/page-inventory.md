# DocWeave 页面总览地图

本文档列出 DocWeave 所有页面、路由、当前状态和导航流转关系。

它是 `docs/ui/pages/` 下各页面规格文件的索引入口。

## 页面总览

| 编号 | 页面 | 路由 | 当前状态 | 所属里程碑 |
|------|------|------|---------|-----------|
| P01 | 登录页 | `/login` | ✅ 已实现（待改造） | M2 基线 |
| P02 | 工作台首页 | `/` | ✅ 已实现（待改造） | M2 基线 |
| P03 | 空间详情页 | `/spaces/:spaceId` | ✅ 已实现（待改造） | M2 基线 |
| P04 | 文档编辑页 | `/documents/:documentId` | ✅ 已实现（待改造） | M2 基线 |
| P05 | 注册页 | `/register` | ○ 仅规格占位，未实现 | M2 扩展 |
| P06 | 搜索页 | `/search` | ○ 仅规格占位，未实现 | M7 RAG 搜索 |
| P07 | RAG 问答/聊天页 | `/chat` | ○ 仅规格占位，未实现 | M7 RAG 问答 |
| P08 | 设置页 | `/settings/*` | △ 路由规划中，未实现 | M2 扩展 |
| P09 | AI 助手页 | `/ai` | △ 规格已定义，未实现 | M5 编辑器 AI |
| P10 | 回收站 | `/trash` | △ 后续阶段 | 延后 |
| P11 | 收藏页 | `/favorites` | △ 后续阶段 | 延后 |
| P12 | 公开分享页 | `/share/:shareId/d/:docId` | △ 后续阶段 | 延后 |
| P13 | 版本历史 | （文档页内 Modal） | △ 后续阶段 | M4 快照 |

**图例：** ✅ 已实现  ○ 第一阶段待实现  △ 后续阶段

## 导航结构

```text
/login          （公开，PublicLayout，已实现）
  ↓ 登录成功

/               （需登录，AppLayout 外壳）
├── /           （工作台首页 → 空间概览 + 文档总览，已实现）
├── /spaces/:spaceId （空间详情 → 文档列表，已实现）
├── /documents/:documentId （文档编辑 → 编辑器 + 元数据，已实现）
├── /search     （🔜 知识库搜索，规格已定义）
├── /chat       （🔜 RAG 问答，规格已定义）
├── /settings/* （🔜 设置页，路由规划中）
└── /ai         （🔜 AI 助手，规格已定义）
```

## 前端实现分层入口

页面信息架构和代码组织已经分开维护：

- 本文档只负责页面清单、路由语义、导航流转、阶段状态和跨页面一致性约定。
- 应用壳层 UI 规格见 [`./app-shell-layout.md`](./app-shell-layout.md)。
- 前端路由拆分、目录树、`router.tsx` 迁移落点和实现边界，统一见 [`../workflow/frontend-route-architecture.md`](../workflow/frontend-route-architecture.md)。

## 页面流转关系

```text
首次访问
  ↓
/login → 登录成功 → /

/（工作台首页，已实现）
  → 点击空间卡片 → /spaces/:spaceId
  → 点击文档卡片 → /documents/:documentId
  → 点击搜索 → /search（M7）
  → 创建空间 → 刷新工作台

/spaces/:spaceId（空间详情，已实现）
  → 点击文档 → /documents/:documentId
  → 创建文档 → 刷新空间

/documents/:documentId（文档编辑，已实现）
  → 保存文档 → 刷新文档
  → 面包屑空间名 → /spaces/:spaceId
  → 版本历史 → Modal（M4）
```

## 优先级建议

| 优先级 | 页面 | 原因 |
|--------|------|------|
| P0 - 阻塞依赖 | 登录页 | 没有认证，所有页面不可用 |
| P1 - 核心价值 | 文档编辑页 | 产品核心，编辑器 + 协同入口 |
| P1 - 核心价值 | 空间详情页 | 内容导航的中心枢纽 |
| P2 - 重要支撑 | 工作台首页 | 产品入口体验 |
| P2 - 重要支撑 | 搜索页 | RAG 检索主要前端 |
| P2 - 重要支撑 | RAG 问答页 | 知识库问答主场景 |
| P3 - 补充完整 | 设置页 | 成员/AI 配置管理 |
| P3 - 补充完整 | 注册页 | 新用户注册流程 |
| P4 - 后续演进 | AI 助手页 | 需要编辑器 AI 能力支撑，当前主闭环仍优先在文档页 |
| P4 - 后续演进 | 版本历史 | 需要快照系统支撑 |
| P4 - 后续演进 | 回收站 | 需要软删除系统支撑 |
| P4 - 后续演进 | 收藏页 | 需要收藏 API 支撑 |
| P4 - 后续演进 | 公开分享页 | 需要分享权限系统支撑 |

## 壳层布局入口

- `AppHeader`、Sidebar 模式和应用壳层的详细 UI 规格，统一见 [`./app-shell-layout.md`](./app-shell-layout.md)。
- 本文档只保留页面级导航语义：公开页挂 `PublicLayout`，已登录业务页挂 `AppLayout`，公开分享页挂 `ShareLayout`。

## 跨页面一致性约定

| 问题 | 约定 |
|------|------|
| 空态设计 | 统一说明"还没有XX" + 给出下一步动作按钮 |
| 错误反馈 | 使用 Mantine Alert 组件，`color="red"`，`variant="light"` |
| 加载状态 | 首次加载用 Paper + Title + Text 占位块，局部操作用 Loader |
| 操作反馈 | 使用 Mantine Notification 组件，`position="top-right"` |
| Not Found | 统一错误卡片："未找到对应XX" + 返回/重试按钮 |
| Disabled | 控件保持可见但不可操作，并说明当前为什么不能执行 |
| 无权限操作 | 根据场景区分：页面级无权限（403）显示明确说明"你没有权限访问"和回退路径；组件级无权限优先给出说明或替代路径，不默认一律隐藏 |
| 未保存离开 | 表单有未保存修改时激活 `beforeunload` 事件，弹出确认对话框 |
| 错误区分粒度 | API 错误应区分"网络不可达"和"业务错误"，分别提供不同的恢复路径（重试 vs 修改输入） |

## 响应式约定

- Desktop：保留完整 Header + Sidebar + MainContent 结构，主任务区维持最高视觉权重。
- Tablet：Sidebar 可收窄或切换为抽屉，但不能挤压主任务表单、列表或编辑器。
- Mobile：单列优先，次级信息后置、折叠或下沉；不把桌面多栏机械堆叠为单列长页。

## 相关文档

- 每个页面的详细规格：`docs/ui/pages/` 目录
- 已补充：`p01-login.md` 到 `p09-ai-assistant.md`
- 规格与当前实现的逐页核对：`docs/planning/48. 单页规格与当前实现逐页核对.md`
- 应用壳层布局规格：`docs/ui/app-shell-layout.md`
- 前端路由与页面代码组织：`docs/workflow/frontend-route-architecture.md`
- 设计规范：`DESIGN.md`
- 前端实现规范：`docs/workflow/frontend-mantine-implementation-guide.md`
- 实施路线图：`docs/planning/00. 当前实施路线图.md`
- UI 评审清单：`docs/workflow/ui-review-checklist.md`
