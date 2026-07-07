# 变更提案

## Why

当前仓库已经分别具备了两段关键能力：一段是 `spaces/documents` 的真实元数据读写，另一段是文档页上的 `BlockNote` 单人编辑与保存。但这两段能力之间仍然缺少真正的产品入口和访问门槛。

现在的 `apps/web` 首页仍然是偏演示性质的 runtime overview，侧边导航也直接写死到了几个 seed document；`apps/api` 虽然已经内置了真实的 token auth、当前用户读取与用户模型，但对外暴露的 `/api/auth/*` 仍然是 scaffold 响应，业务资源也没有真正收口到受保护会话之后。

这导致项目虽然“可以打开文档并保存”，却还不能被认为完成了路线图定义的 M2 闭环。用户还不能通过正式登录进入工作台，也不能从当前用户上下文出发，经由真实空间树进入文档页面并完成编辑保存。现在需要补上这层入口与访问链路，让 “登录 -> 进入空间 -> 打开文档 -> 编辑保存” 成为完整产品主链路。

## What Changes

- 将 `apps/api` 的认证入口从 scaffold 响应切换为真实 token 登录、登出与当前用户读取能力。
- 为 `spaces`、`documents` 等 M2 业务资源加上最小认证门槛，并保留后续权限精细化扩展空间。
- 将 `apps/web` 的首页/壳层重构为真正的认证入口与工作台入口，而不是 demo overview。
- 在工作台壳层中展示当前用户信息、真实空间树与文档导航，让用户从空间树进入文档页。
- 保持现有文档编辑与保存能力不回退，并让它只能从正式工作台链路进入。

## Capabilities

### 新增能力

- auth-session-current-user-baseline
- workbench-shell-navigation

### 修改能力

- metadata-write-ui-flow
- single-user-document-editor-baseline
- api-metadata-route-baseline

## Scope

### In Scope

- `POST /api/auth/login` 使用真实账号凭证签发 access token
- `POST /api/auth/logout` 使用当前 token 完成登出
- `GET /api/auth/me` 返回真实当前用户
- `spaces` / `documents` 业务接口收口到已登录用户之后
- `apps/web` 新增登录入口、当前用户状态、受保护工作台入口
- `apps/web` 在壳层中展示空间树、文档导航与退出登录动作
- 从工作台进入文档页并继续沿用现有编辑保存能力

### Out of Scope

- 不实现细粒度权限模型、space 成员关系或角色隔离
- 不引入协同、AI、RAG、快照、导出或版本历史
- 不扩展新的编辑器能力，只复用现有单人编辑保存链路
- 不重做整体视觉系统，只在现有 Mantine 体系内把工作台入口收口成真实产品流

## Impact

- 影响的代码区域：`apps/api`、`apps/web`、`apps/api/tests`
- 影响的 API 或接口：`/api/auth/*`、受保护的 `spaces/documents` 读取与写入链路
- 影响的用户路径：从匿名访问 overview 演示页，变为先登录再进入真实工作台与空间树
