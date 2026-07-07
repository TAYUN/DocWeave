# 技术设计

## Context

- 当前状态：
  - `apps/api` 已经具备 `User` 模型、token guard、`AccessTokensController`、`ProfileController` 与测试插件，但对外 `/api/auth/*` 仍走 demo scaffold。
  - `apps/web` 已经具备真实 `spaces/documents` 查询、文档编辑与保存能力，但首页与侧边导航仍然是演示壳，未建立认证门槛和真实工作台入口。
  - `DocweaveCatalogService` 已经提供 `getSpaceTree` 与文档内容持久化能力，说明 M2 缺口主要是入口与边界收口，而不是正文保存本身。
- 约束条件：
  - 本次只建立 “认证 + 当前用户 + 工作台入口 + 空间树 + 文档编辑保存” 的最小产品链路。
  - 不在本次 change 中引入成员关系、资源级 ACL 或多 workspace 权限模型。
  - `apps/web` 必须继续遵守 Mantine 组件体系与现有 TanStack Router / Query 基线。
  - BlockNote 编辑器集成继续复用既有实现，不重新发明 editor protocol。
- 相关参与方：
  - 需要直接使用产品的前端开发者与设计协作者。
  - 需要验证 M2 闭环是否真正成立的架构/交付负责人。

## Goals

- 让匿名访问先进入登录页，而不是直接进入 demo workbench。
- 让登录后的用户能读到真实当前用户，并以此进入受保护工作台。
- 让工作台左侧导航从硬编码快捷入口升级为真实空间树与文档树入口。
- 保证登录后的用户仍然可以沿现有文档页完成打开、编辑、保存。

## Decisions

### 决策 1：认证入口直接复用现有 Adonis token 能力，不再维护平行 scaffold controller

- **选择**：
  - `/api/auth/login` 改为使用现有 `AccessTokensController` 里的凭证校验与 token 签发逻辑。
  - `/api/auth/me` 改为使用现有 `ProfileController` 返回当前用户。
  - `/api/auth/logout` 改为使用当前 token 完成撤销。
- **理由**：
  - 代码里已经存在真实 auth 组件，当前缺的只是路由对接和受保护边界。
  - 这样能最大化复用 Adonis 官方能力，避免继续维护假的 auth 语义。
- **备选方案**：
  - 继续保留 `AuthController` scaffold，再在内部转发到真实逻辑。
  - 直接改用 session guard 做浏览器登录。
- **不选原因**：
  - 保留 scaffold 会继续制造双轨语义。
  - session guard 需要额外 cookie/CSRF 收口，本次最小闭环更适合直接复用已存在的 token guard。

### 决策 2：M2 业务资源先整体挂到认证之后，不在本次切细粒度权限

- **选择**：
  - `spaces`、`documents` 的读取和写入统一要求已登录。
- **理由**：
  - 这能让 M2 链路真正变成“登录后工作台”，同时不把当前 change 扩张成权限系统设计。
  - 当前路线图对 M2 的要求是认证与会话成立，而不是 space 成员模型完备。
- **备选方案**：
  - 只保护写接口，保留读接口匿名可见。
  - 同时实现空间级角色和所有权。
- **不选原因**：
  - 只保护写接口会让真实工作台入口仍然模糊。
  - 细粒度权限会显著超出本次范围。

### 决策 3：Web 端使用本地 token 状态 + `auth/me` 预热当前用户，形成受保护路由壳

- **选择**：
  - 在 `apps/web` 建立一个最小 auth 状态层，持久化 access token。
  - 所有工作台路由在进入前先通过 token + `auth/me` 确认当前用户。
  - 未登录直接回到登录页，已登录进入工作台入口。
- **理由**：
  - 现有前端没有 session/cookie 基础，但已经有 Tuyau client 和 React Query，可以很自然地承接 token + current user 查询。
  - 这能把“登录成功”和“允许进入工作台”收口成单一语义。
- **备选方案**：
  - 只在登录页 local state 里保存 token，不做统一 current-user 解析。
  - 用路由外的全局组件硬拦截未登录态。
- **不选原因**：
  - 不统一 current-user 会导致壳层、文档页、登出动作重复处理登录状态。
  - 路由外硬拦截更难和 TanStack Router 的入口导航对齐。

### 决策 4：工作台左侧导航改为真实空间树，并把 overview 改为真正的 workbench landing

- **选择**：
  - 工作台壳层左侧展示用户信息、空间列表、空间下文档列表与退出动作。
  - 首页从“phase-1 runtime overview”改成真正的 workbench landing，负责提示当前空间与文档入口。
- **理由**：
  - 当前最影响闭环判断的，不是编辑页本身，而是用户如何从产品入口自然走到编辑页。
  - 空间树已经有后端承接位，应该优先让入口行为贴近真实产品，而不是继续维持 demo shortcut。
- **备选方案**：
  - 保留现有 overview，只在里面额外塞一个 space list。
  - 继续依赖文档硬编码快捷按钮。
- **不选原因**：
  - 继续保留 overview 会让“真正的工作台入口”依旧模糊。
  - 硬编码快捷按钮与空间树需求相冲突。

## Risks And Trade-Offs

- 风险：如果本地数据库没有可登录用户，真实登录入口会变成死路。
  - 缓解措施：补一个最小可登录账号的 seed/验证路径，并在界面中给出开发态默认账号提示。
- 风险：前端引入 token 持久化后，未处理好失效 token 会让路由循环或空白。
  - 缓解措施：把 `401` 收口成清 token + 回登录页的统一行为。
- 风险：工作台壳层重构可能影响已有文档页访问路径。
  - 缓解措施：保持 `/documents/$documentId` 路由与现有编辑保存逻辑不变，只调整进入路径和壳层导航。
- 权衡：本次选择“先整体要求登录”，意味着暂不表达资源所属关系。
  - 说明：这是对 M2 最小闭环的有意收缩，后续权限系统应在独立 change 中继续细化。
