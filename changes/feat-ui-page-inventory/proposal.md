# 变更提案：UI 页面清单与页面规格基线

## 背景（Why）

DocWeave 当前处于 M1 工程骨架完成、准备进入 M2 主业务元数据与单人编辑的阶段。现有前端页面存在以下问题：

1. **无页面清单** — 项目没有一份文档说清楚"一共有哪些页面，每个页面的路由和状态是什么"
2. **页面规格缺失** — 每个页面的用途、布局、内容分区、状态（loading/empty/error/not found）没有文本级定义，导致 AI 实现时只能靠猜测，产出不可预期
3. **当前页面实现质量参差** — 登录页、工作台首页、空间详情页、文档编辑页均由 AI 按零散上下文生成，缺少统一的信息架构、主次分区和状态覆盖

参考项目 `D:\code-my\ai-doc-flow-v0` 的设计方法——它通过"全页面布局设计规划 + 前端骨架实现指导"的方式，把页面总览、布局框架、每页线框、状态设计和跨页面一致性问题统一收口为一套文本级规格，使得 AI 实现时能稳定产出一致的结果。

DocWeave 需要借鉴这一方法，但同时要适配自身的 stack 约束：

- **Mantine 默认主题**（而非 Tailwind v4 + shadcn）
- **TanStack Router**（而非 Next.js / React Router）
- **DocWeave 路线图阶段**（M1-M8，非 ai-doc-flow 的阶段划分）

## 变更内容（What Changes）

1. 产出 `docs/ui/page-inventory.md` — 页面总览地图
   - 列出 DocWeave 所有页面、路由、当前状态、所属里程碑
   - 页面导航流转图
   - 优先级标注

2. 产出全局布局框架定义 — 作为所有页面的基础骨架
   - 布局结构图（AppHeader + Sidebar + MainContent 三层架构）
   - Sidebar 模式定义（GlobalMode / SpaceMode / DocumentMode）
   - AppHeader 的主任务、行为边界与不可用态约定
   - 桌面 / 平板 / 移动端的主任务保护约定

3. 为每个当前已实现和第一阶段待实现的页面产出独立规格文件到 `docs/ui/pages/`
   - 每个规格包含：用途、路由、布局线框（ASCII 图）、内容分区描述、状态规格（loading/empty/error/not found/disabled/restricted）、导航关系、实现约束

4. 产出 `changes/feat-ui-page-inventory/specs/` 下的能力规格文件
   - 按 docweave-ui-page-specs / docweave-layout-framework / docweave-page-inventory 三个能力组织

5. 为后续 M2 页面改造提供可直接参考的页面定义基线

## 能力（Capabilities）

### 新增能力

- `docweave-page-inventory` — 页面总览清单
- `docweave-layout-framework` — 全局布局框架定义
- `docweave-ui-page-specs` — 每个页面的独立规格文档

### 修改能力

- （无代码修改，纯规格文档产出）

## 范围（Scope）

### 范围内（In Scope）

- `docs/ui/page-inventory.md` 页面总览地图
- `docs/ui/pages/` 下每个页面的独立规格文件
- `changes/feat-ui-page-inventory/proposal.md` 本提案
- `changes/feat-ui-page-inventory/design.md` 设计方案
- `changes/feat-ui-page-inventory/specs/` 能力规格
- `changes/feat-ui-page-inventory/tasks.md` 执行任务清单

涉及以下页面（当前已实现 + 第一阶段规划）：

| 编号 | 页面 | 路由 | 当前状态 |
|------|------|------|---------|
| P01 | 登录页 | /login | ✅ 已实现 |
| P02 | 工作台首页 | / | ✅ 已实现 |
| P03 | 空间详情页 | /spaces/:spaceId | ✅ 已实现 |
| P04 | 文档编辑页 | /documents/:documentId | ✅ 已实现 |
| P05 | 注册页 | /register | ○ 第一阶段待实现 |
| P06 | 搜索页 | /search | ○ 第一阶段待实现（M7） |
| P07 | RAG 问答/聊天页 | /chat | ○ 第一阶段待实现（M7） |
| P08 | 设置页 | /settings/* | △ 后续阶段 |
| P09 | AI 助手页 | /ai | △ 后续阶段（M5） |

### 范围外（Out of Scope）

- 不涉及任何代码改动
- 不涉及组件库选择调整
- 不涉及后端 API 设计
- 不涉及实际页面实现
- 不涉及 ai-doc-flow-v0 的全部页面覆盖（只取其设计方法，不照搬页面清单）

## 参考来源

- `D:\code-my\ai-doc-flow-v0\全页面布局设计规划.md` — 页面总览、布局框架、每页线框、状态设计的组织方式
- `D:\code-my\ai-doc-flow-v0\前端骨架实现指导文档.md` — 布局组件拆分、实现阶段的划分方法
- DocWeave 现有 `docs/` 文档体系 — 设计规范、实现指南、路线图
- DocWeave 现有 `apps/web/src/router.tsx` — 当前实际路由与页面实现

## 影响（Impact）

- 影响的文档区域：`docs/ui/` 新增目录，`changes/feat-ui-page-inventory/`
- 不涉及代码变更
- 后续所有前端页面实现 change 都可以引用 `docs/ui/pages/` 下的规格作为实现依据
- `docweave-ui-reviewer` agent 可以基于这些规格进行评审
- 本 change 的完成标准是“页面规格基线可被后续实现 change 稳定引用”，不是在本 change 内直接落地页面代码
- 后续若进入页面实现，建议单独开实现类 change，并显式引用本 change 的页面规格与页面清单
