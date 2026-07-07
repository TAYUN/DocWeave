# 实现任务

## 文件结构

- `Modify: apps/api/start/routes.ts` — 将 auth 路由切到真实控制器，并为 `spaces/documents` 增加认证门槛
- `Modify: apps/api/app/controllers/auth_controller.ts` — 移除或收缩旧 scaffold 入口，避免双轨语义
- `Modify: apps/api/app/controllers/access_tokens_controller.ts` — 对齐登录返回结构到 web 端实际消费格式
- `Modify: apps/api/app/controllers/profile_controller.ts` — 作为当前用户读取入口返回稳定 payload
- `Modify: apps/api/app/services/docweave_catalog_service.ts` — 如有需要，补当前工作台树读取所需的最小聚合输出
- `Modify: apps/api/database/seeders/docweave_baseline_seeder.ts` — 补最小可登录开发账号与工作台入口数据
- `Create: apps/api/tests/functional/auth_workbench_flow.spec.ts` — 为登录、当前用户、受保护资源与登出链路提供回归验证
- `Modify: apps/web/src/lib/tuyau-client.ts` — 在统一 client 上挂载 token header 读取
- `Modify: apps/web/src/lib/api.ts` — 增加登录、登出、当前用户、空间树读取与统一 401 收口
- `Create: apps/web/src/lib/auth.ts` — 承接 token 持久化、当前用户同步与开发态 auth 辅助逻辑
- `Modify: apps/web/src/lib/workspace-data.ts` — 去掉演示阶段数据并补齐真实 workbench 数据入口
- `Modify: apps/web/src/router.tsx` — 新增登录路由、受保护 workbench 壳层、当前用户与空间树导航
- `Modify: apps/web/src/App.css` — 调整工作台壳层、登录页、空间树与当前用户区域样式

## Interfaces

### Web → API

- **Consumes**: `POST /api/auth/login`
  - 输入：`{ email: string; password: string }`
  - 输出：`{ data: { user: CurrentUser; token: string } }`
- **Consumes**: `POST /api/auth/logout`
  - 输入：Bearer token
  - 输出：`{ message: string }`
- **Consumes**: `GET /api/auth/me`
  - 输入：Bearer token
  - 输出：`{ data: CurrentUser }`
- **Consumes**: `GET /api/spaces/:spaceId/tree`
  - 输入：Bearer token + `spaceId`
  - 输出：`{ data: { space: SpaceSummary; children: SpaceTreeNode[] } }`

### API → PostgreSQL

- **Consumes**: `users` + `auth_access_tokens` 作为登录/当前用户来源
- **Consumes**: `spaces` + `documents` 作为工作台树与文档编辑入口来源

### Web Internal

- **Produces**: `AuthSession = { token: string | null; user: CurrentUser | null }`
- **Consumes**: 受保护路由在进入时依赖 `AuthSession` 与 `auth/me` 结果判断跳转

## 1. Batch 1: 认证与受保护 API 边界收口

- **Depends on**: Batch 0
- **Files**: `apps/api/start/routes.ts`, `apps/api/app/controllers/auth_controller.ts`, `apps/api/app/controllers/access_tokens_controller.ts`, `apps/api/app/controllers/profile_controller.ts`, `apps/api/database/seeders/docweave_baseline_seeder.ts`, `apps/api/tests/functional/auth_workbench_flow.spec.ts`
- **Interfaces**:
  - Consumes：`loginValidator`, `User.verifyCredentials`, `User.accessTokens`, `UserTransformer`
  - Produces：真实 `login/logout/me` 契约；受保护 `spaces/documents` 访问边界
- [x] **1.1 编写失败测试**
  - 为匿名访问 `auth/me`、`spaces` 与登录登出链路编写 functional test，先证明当前 scaffold/匿名访问行为不符合 M2。
- [x] **1.2 运行测试并确认失败**
  - Run: `pnpm --dir apps/api test --files tests/functional/auth_workbench_flow.spec.ts`
  - Expected: 当前 `auth` 响应和匿名资源访问无法通过。
- [x] **1.3 实现最小化代码**
  - 切换真实 auth 路由、保护 `spaces/documents`、补开发态登录账号 seed，并清除旧 scaffold 语义。
- [x] **1.4 运行测试并确认通过**
  - Run: `pnpm --dir apps/api test --files tests/functional/auth_workbench_flow.spec.ts`
  - Expected: PASS
- [x] **1.5 整理与复核**
  - 检查 API 返回结构、401 行为与种子账号说明一致，没有引入额外权限语义。

## 2. Batch 2: Web 登录、当前用户与真实工作台入口

- **Depends on**: Batch 1
- **Files**: `apps/web/src/lib/tuyau-client.ts`, `apps/web/src/lib/api.ts`, `apps/web/src/lib/auth.ts`, `apps/web/src/lib/workspace-data.ts`, `apps/web/src/router.tsx`, `apps/web/src/App.css`
- **Interfaces**:
  - Consumes：`POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`
  - Produces：登录页、受保护 shell、当前用户展示、logout 流程
- [x] **2.1 编写失败测试**
  - 先用类型与构建约束证明当前前端没有登录页、没有 current-user 状态、也没有真实 workbench 入口。
- [x] **2.2 运行测试并确认失败**
  - Run: `pnpm typecheck:web`
  - Expected: 当前新增 auth/workbench 接口与路由尚不存在。
- [x] **2.3 实现最小化代码**
  - 新增登录页、token 持久化、current-user 同步、受保护 workbench 壳层与登出动作。
- [x] **2.4 运行测试并确认通过**
  - Run: `pnpm typecheck:web`
  - Expected: PASS
- [x] **2.5 轻量复核**
  - 检查未登录跳登录、已登录进工作台、失效 token 回退登录三条入口语义一致。

## 3. Batch 3: 空间树导航与完整 M2 产品链路收口

- **Depends on**: Batch 2
- **Files**: `apps/web/src/router.tsx`, `apps/web/src/App.css`, `apps/web/src/lib/api.ts`, `apps/api/app/services/docweave_catalog_service.ts`（仅在树数据需要补充时修改）
- **Interfaces**:
  - Consumes：`GET /api/spaces`, `GET /api/spaces/:spaceId/tree`, `GET /api/documents/:documentId`, `PATCH /api/documents/:documentId`
  - Produces：空间树入口、文档打开路径、现有编辑保存闭环的真实入口
- [x] **3.1 编写失败测试**
  - 先以工作区级验证命令和手动场景描述证明当前壳层仍依赖硬编码文档快捷入口，不能代表真实空间树。
- [x] **3.2 运行测试并确认失败**
  - Run: `pnpm check:workspace`
  - Expected: 当前无法证明 “登录 -> 进入空间 -> 打开文档 -> 编辑保存” 已成立。
- [x] **3.3 实现最小化代码**
  - 用真实空间树替换硬编码导航，确保文档页从工作台树进入后仍可保存并刷新重载。
- [x] **3.4 运行测试并确认通过**
  - Run:
    - `pnpm check:workspace`
    - manual scenario verification
  - Expected: PASS
- [x] **3.5 收口检查**
  - 确认空间树、当前用户、文档编辑保存三段入口已经形成单一路径，没有保留 demo-only 快捷入口。
