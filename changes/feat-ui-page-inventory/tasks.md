# 执行任务清单

## 变更：feat-ui-page-inventory

## M1：创建变更目录结构

- [x] 创建 `changes/feat-ui-page-inventory/` 目录
- [x] 创建 `docs/ui/` 和 `docs/ui/pages/` 目录

## M2：产出变更工件

- [x] 产出 `proposal.md`
  - [x] 背景：说明当前无页面清单和规格的问题
  - [x] 变更内容：产出页面总览 + 布局框架 + 页面规格
  - [x] 能力定义：三个新增能力
  - [x] 范围：明确范围内外
  - [x] 参考来源：ai-doc-flow-v0 的设计方法

- [x] 产出 `design.md`
  - [x] 设计原则：页面规格层的定位
  - [x] 参考项目方法提炼
  - [x] DocWeave 适配规则
  - [x] 页面总览表
  - [x] 全局布局框架设计
  - [x] 跨页面一致性约定

- [x] 产出 specs/ 能力规格文件
  - [x] `specs/docweave-page-inventory/spec.md`
  - [x] `specs/docweave-layout-framework/spec.md`
  - [x] `specs/docweave-ui-page-specs/spec.md`

## M3：产出文档交付物

- [x] 产出 `docs/ui/page-inventory.md`
  - [x] 页面总览地图（13 个页面，含路由和状态）
  - [x] 导航结构图
  - [x] 页面流转关系
  - [x] 优先级建议
  - [x] 全局布局框架定义
  - [x] Sidebar 模式详细规格（GlobalMode / SpaceMode / DocumentMode）
  - [x] AppHeader 组件规格（三段式布局 + 行为规则）
  - [x] 跨页面一致性约定（含无权限/未保存/错误区分粒度）
  - [x] 响应式约定（Desktop / Tablet / Mobile 主任务保护）

- [x] 产出 `docs/ui/pages/p01-login.md`
  - [x] 路由、用途、ASCII 线框、内容分区、状态规格、导航关系、实现约束
  - [x] 登录失败分为"凭据错误"与"网络错误"，分别提供恢复路径
  - [x] 开发账号使用 `import.meta.env.DEV` 控制显隐
  - [x] 预留注册入口标注

- [x] 产出 `docs/ui/pages/p02-workbench-home.md`
  - [x] 路由、用途、ASCII 线框、内容分区、状态规格、导航关系、实现约束
  - [x] 修复三个同权重区块并列问题：创建空间降级为按钮触发 Modal
  - [x] 空间列表为主区，文档列表为次区
  - [x] 添加"空间有数据但文档仍在加载"的混合状态
  - [x] 引导区改名，避免"Hero"命名与设计基线冲突

- [x] 产出 `docs/ui/pages/p03-space-detail.md`
  - [x] 路由、用途、ASCII 线框、内容分区、状态规格、导航关系、实现约束
  - [x] 创建文档表单默认折叠，按钮触发展开；文档为空时自动展开
  - [x] 补充 403"无权限"状态
  - [x] 空间信息面板增加元数据（文档数、创建者、更新时间）

- [x] 产出 `docs/ui/pages/p04-document-editor.md`
  - [x] 路由、用途、ASCII 线框、内容分区、状态规格、导航关系、实现约束
  - [x] 消除顶部面板与编辑器面板的标题/摘要重复：顶部仅保留状态标签
  - [x] 补充 Not Found（404）状态
  - [x] 补充 `beforeunload` 未保存离开提示
  - [x] 添加"有未保存修改"的视觉提示条
  - [x] 元数据面板规划替换为有意义的上下文信息

- [x] 产出 `docs/ui/pages/p05-register.md`
  - [x] 保留注册页占位规格，避免后续 AI 无锚点实现

- [x] 产出 `docs/ui/pages/p06-search.md`
  - [x] 保留搜索页占位规格，约束 M7 前的不可用态表达

- [x] 产出 `docs/ui/pages/p07-rag-chat.md`
  - [x] 保留 RAG 问答页占位规格，强调来源链路

- [x] 产出 `docs/ui/pages/p08-settings.md`
  - [x] 保留设置页占位规格，明确导航入口与权限影响

- [x] 产出 `docs/ui/pages/p09-ai-assistant.md`
  - [x] 保留 AI 助手页规格，明确与 `/chat`、`/documents/:documentId` 的职责边界
  - [x] 明确 M5 前仅占位、M5 后作为入口页/状态页的阶段边界

## M4：UI 评审修复

- [x] 按 docweave-ui-reviewer 评审结果修复所有问题
  - [x] P02: 修复三个同权重区块并列，创建空间降级为按钮触发 Modal
  - [x] P04: 消除标题/摘要重复，顶部仅保留状态标签
  - [x] P04: 补充 Not Found 状态和 beforeunload 离开提示
  - [x] P03: 创建文档表单改为默认折叠，补充 403 状态
  - [x] P01: 拆分登录失败为凭据错误/网络错误，明确开发账号控制策略
  - [x] page-inventory: 补充 AppHeader 规格和 Sidebar 模式详细规格
  - [x] page-inventory: 跨页面一致性约定扩展（无权限/未保存/错误区分）
  - [x] 修复页面编号冲突（P08 设置页 / P09 AI 助手页）
  - [x] 修复 `documentId` / `docId` 路由参数命名不一致
  - [x] 补充 disabled 与 restricted 的区分规则
  - [x] 补充 AppHeader 可执行 requirement 与响应式约束

## M5：验证与收口

- [x] 运行 `ssf state init` 初始化 change 状态
- [x] 运行 `ssf state transition` 推进到 `specifying`
- [x] 重新运行 `ssf state check` 确认一致性
- [x] 运行 `ssf audit` 产出审计报告

## M6：规划型 change 收口口径

- [x] 明确本 change 的完成标准是“页面规格基线交付完成”，而不是直接进入页面代码实现
- [x] 明确后续页面开发应作为独立实现类 change 引用本 change 产物
- [x] 明确当前阶段不补 `execution-contract.md`，避免误导为即将进入 build

## 文件清单

```
changes/feat-ui-page-inventory/
├── proposal.md
├── design.md
├── tasks.md
├── specs/
│   ├── docweave-page-inventory/spec.md
│   ├── docweave-layout-framework/spec.md
│   └── docweave-ui-page-specs/spec.md
└── execution-contract.md  （后续实际实现时补）

docs/ui/
├── page-inventory.md
└── pages/
    ├── p01-login.md
    ├── p02-workbench-home.md
    ├── p03-space-detail.md
    ├── p04-document-editor.md
    ├── p05-register.md
    ├── p06-search.md
    ├── p07-rag-chat.md
    ├── p08-settings.md
    └── p09-ai-assistant.md
```
