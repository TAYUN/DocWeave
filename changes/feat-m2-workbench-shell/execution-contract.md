# 执行合同

## Intent Lock

- **变更名称**：`feat-m2-workbench-shell`
- **要解决的问题**：
  - 当前仓库已经分别拥有文档元数据 CRUD 与单人正文编辑保存能力，但仍缺少真实认证入口、当前用户上下文、受保护工作台入口与空间树导航，因此还不能构成路线图定义的 M2 闭环。
- **范围内**：
  - 真实 `login/logout/me`
  - `spaces/documents` 的受保护访问边界
  - web 登录页、当前用户、退出登录、受保护 workbench shell
  - 真实空间树与从空间树进入文档页的路径
  - 保持现有文档编辑保存链路可用
- **范围外**：
  - 细粒度权限、成员关系、角色模型
  - 协同、AI、RAG、快照、导出、版本历史
  - 新的编辑器能力或新的信息架构重设计

## Approved Behavior

- **已批准需求摘要**：
  - 用户必须使用真实凭证登录，获得可用 access token，并通过真实当前用户接口进入工作台。
  - 匿名用户不能直接访问 `auth/me`、`spaces`、`documents` 等 M2 资源。
  - 工作台必须展示当前用户与真实空间树，并支持从空间树进入文档页。
  - 用户从登录进入工作台后，仍然可以打开文档并完成已有的编辑保存流程。
- **关键场景**：
  - 有效账号登录成功，进入 workbench。
  - 匿名请求访问 `auth/me`、`spaces`、`documents` 被拒绝。
  - 登录后 shell 显示当前用户与退出登录动作。
  - 登录后通过空间树打开文档并保存。
- **验收检查**：
  - `POST /api/auth/login` 返回真实 token 与当前用户。
  - `GET /api/auth/me` 仅对已认证请求返回真实用户。
  - workbench 导航不再依赖硬编码文档快捷入口。
  - “登录 -> 进入空间 -> 打开文档 -> 编辑保存” 可手动复现。

## Design Constraints

- **架构约束**：
  - 优先复用现有 `AccessTokensController`、`ProfileController`、`User` 模型与 token guard，不再维护平行 scaffold 认证语义。
  - 保持现有 `/documents/$documentId` 文档页和编辑器保存逻辑，只重构其入口路径与壳层依赖。
- **接口约束**：
  - web 端统一通过 `apps/web/src/lib/api.ts` 消费 `auth/spaces/documents`，不把认证细节散落到页面组件。
  - `auth/me` 必须来自当前 token 的真实用户上下文，而不是 demo payload。
- **依赖约束**：
  - 前端继续使用 `Mantine + TanStack Router + TanStack Query + Tuyau` 现有技术基线。
  - BlockNote 集成沿用当前 `@docweave/editor` 入口，不在本次重建 editor abstraction。
- **数据约束**：
  - 需要存在最小可登录账号，且不新增成员关系表或资源所有权字段。

## Task Batches

### Batch 1

- **目标**：把 API 认证入口与 M2 资源边界切到真实受保护语义
- **输入**：
  - `proposal.md`
  - `specs/auth-session-current-user-baseline/spec.md`
  - `design.md` 中认证与受保护边界决策
- **输出**：
  - 真实 `login/logout/me`
  - 受保护 `spaces/documents`
  - 可登录开发账号与 functional test
- **完成标准**：
  - functional test 证明匿名访问被拒绝、登录成功、当前用户可读、登出后 token 失效

### Batch 2

- **目标**：建立 web 登录页、当前用户状态与受保护 workbench shell
- **输入**：
  - Batch 1 API 契约
  - `specs/workbench-shell-navigation/spec.md`
- **输出**：
  - token 持久化
  - current-user 同步
  - 登录页 / 登出动作 / 受保护 shell
- **完成标准**：
  - 未登录回登录页，已登录进入 workbench，失效 token 自动退回登录页

### Batch 3

- **目标**：把 workbench 导航切成真实空间树，并闭合进入文档保存路径
- **输入**：
  - Batch 2 web auth shell
  - 现有 `getSpaceTree` 与文档编辑保存能力
- **输出**：
  - 真实空间树导航
  - 从空间树进入文档页的稳定路径
  - 现有编辑保存闭环继续可用
- **完成标准**：
  - 手动验证 “登录 -> 进入空间 -> 打开文档 -> 编辑保存” 成立

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 匿名访问 `auth/me` 和 `spaces/documents` 被拒绝
  - 登录返回真实 token 与用户
  - 登出后 token 失效
- **必需的边界情况**：
  - 本地持久化 token 缺失时不允许进入 workbench
  - 失效 token 不应让页面停留在半登录状态
  - 空间树为空时仍需展示明确空态，而不是回退到硬编码文档入口
- **回归敏感区域**：
  - 现有 `documents.update` 的正文保存行为
  - 现有 `spaces` / `documents` query key 刷新逻辑
  - 文档页路由切换后的本地草稿重置逻辑

## Execution Mode

- **模式**：`SDD`
- **选择理由**：
  - 这次变更横跨 `apps/api`、`apps/web`、测试与 seed，包含 API 契约、认证状态与路由壳层调整，属于多批次跨模块改动，不能按轻量 tweak 处理。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | — |
| Correctness | Pending | — |
| Coherence | Pending | — |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 完成后，确认 `auth` 契约与受保护边界没有继续保留 scaffold 语义
  - Batch 2 完成后，确认 current-user、login、logout、route guard 语义一致
  - Batch 3 完成后，确认空间树入口没有破坏现有文档编辑保存
- **阻塞类别**：
  - 真实 `auth/me` 未建立
  - 匿名仍可直接访问 workbench 资源
  - 工作台仍依赖硬编码文档快捷入口
  - 文档编辑保存回归失败

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果需要把 space 成员关系、资源所属关系或权限矩阵一起纳入本次 change
- **何时回退到 `bridging`**：
  - 如果实际实现发现 token auth 不足以支撑现有路由，需要改成 session/cookie 模式
  - 如果工作台入口需要新增超出既定范围的信息架构
- **何时不得继续实现**：
  - functional test 无法建立可登录账号与真实 token 语义
  - API 契约与 planning/specs 描述产生冲突
  - 文档保存链路在认证改造后出现回归且无法在当前范围内修复
