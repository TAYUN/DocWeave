# 实现任务

## 文件结构

- `Modify: apps/web/package.json` — 增加 `@tanstack/react-router` 与 `@tanstack/react-query`
- `Create: apps/web/src/router.tsx` — 建立 overview / space / document 路由壳
- `Create: apps/web/src/lib/api.ts` — 建立前端元数据 API 访问层
- `Modify: apps/web/src/main.tsx` — 挂载 QueryClientProvider 与 RouterProvider
- `Modify: apps/web/src/App.css` — 提供工作台壳布局与 space/document 列表样式
- `Modify: apps/web/vite.config.ts` — 为 `/api` 提供本地代理
- `Modify: apps/api/start/routes.ts` — 建立 phase-1 元数据与占位能力路由
- `Create: apps/api/app/models/space.ts` — 定义空间模型
- `Create: apps/api/app/models/document.ts` — 定义文档模型
- `Create: apps/api/database/migrations/*create_spaces_table.ts` — 创建 `spaces` 表
- `Create: apps/api/database/migrations/*create_documents_table.ts` — 创建 `documents` 表
- `Create: apps/api/database/seeders/docweave_baseline_seeder.ts` — 提供本地 baseline seed
- `Modify: apps/api/config/database.ts` — 切换到 PostgreSQL 基线
- `Modify: apps/api/start/env.ts` — 声明 `DB_*` 环境变量
- `Modify: apps/api/.env.example` — 补齐 PostgreSQL / Redis / Qdrant 本地模板

## 接口

### Web → API

- **Consumes**: `GET /api/spaces` — 提供空间列表
- **Consumes**: `GET /api/documents` — 提供文档列表
- **Consumes**: `GET /api/documents/:documentId` — 提供文档详情

### API → PostgreSQL

- **Consumes**: `spaces` table — 提供空间元数据
- **Consumes**: `documents` table — 提供文档元数据
- **Consumes**: `docweave_baseline_seeder` — 初始化本地基础数据

## 1. Batch 1: 规范化 web 路由与 Query 骨架

- [x] **1.1 编写失败的测试**

```text
检查 apps/web 仍是默认 Vite demo，且不存在：
- src/router.tsx
- TanStack Router / Query 依赖
- 真实 /api 数据读取层
```

- [x] **1.2 运行测试并确认失败**

Run: `pnpm --dir apps/web exec tsc -b --pretty false`
Expected: 在切换到新骨架前，路由与数据层能力尚不存在

- [x] **1.3 实现最小化代码**

```text
实现：
- overview 路由
- /spaces/:spaceId 路由
- /documents/:documentId 路由
- TanStack Query 驱动的 spaces/documents 数据读取
- Vite /api 代理
```

- [x] **1.4 运行测试并确认通过**

Run:
- `pnpm typecheck:web`
- `pnpm build:web`

Expected: PASS

## 2. Batch 2: 规范化 API 路由与模块骨架

- [x] **2.1 编写失败的测试**

```text
检查 apps/api 是否仍停留在 starter 默认认证样板，而没有：
- spaces/documents 元数据接口
- 显式的 collaboration / ai / rag 占位入口
```

- [x] **2.2 运行测试并确认失败**

Run: `pnpm --dir apps/api typecheck`
Expected: 在替换默认路由前，phase-1 元数据边界尚未建立

- [x] **2.3 实现最小化代码**

```text
实现：
- /api/spaces
- /api/spaces/:spaceId/tree
- /api/documents
- /api/documents/:documentId
- /api/collaboration/token
- /api/ai/editor
- /api/rag/search
- /api/rag/chat
```

- [x] **2.4 运行测试并确认通过**

Run: `pnpm typecheck:api`
Expected: PASS

## 3. Batch 3: 建立 PostgreSQL 元数据基线

- [x] **3.1 编写失败的测试**

```text
检查：
- API 仍使用 SQLite 默认配置
- 不存在 spaces/documents 模型和迁移
- 不存在 baseline seeder
```

- [x] **3.2 运行测试并确认失败**

Run: `pnpm --dir apps/api exec node ace migration:status`
Expected: 在切换前，不存在目标元数据表迁移

- [x] **3.3 实现最小化代码**

```text
实现：
- PostgreSQL 连接配置
- DB_* 环境变量模板
- Space / Document 模型
- spaces / documents 迁移
- baseline seeder
```

- [x] **3.4 运行测试并确认通过**

Run:
- `pnpm --dir apps/api exec node ace migration:run`
- `pnpm --dir apps/api exec node ace db:seed`
- `pnpm --dir apps/api exec node ace migration:status`

Expected: PASS

## 4. Batch 4: 对齐前后端元数据链路

- [x] **4.1 编写失败的测试**

```text
检查前端是否仍依赖本地假数据，而不是通过 API 展示真实 seed 数据。
```

- [x] **4.2 运行测试并确认失败**

Run: `pnpm check:workspace`
Expected: 在链路对齐前，工作区检查无法证明 web/api/postgres 已联通

- [x] **4.3 实现最小化代码**

```text
实现：
- 前端列表/详情页从 API 读取真实数据
- space 页面支持从列表导航进入
- 数据库 seed 可直接支撑当前页面渲染
```

- [x] **4.4 运行测试并确认通过**

Run:
- `pnpm check:workspace`
- `pnpm build:web`
- `psql -h 127.0.0.1 -p 5432 -U root -d docweave -c "SELECT id, name FROM spaces;"`

Expected: PASS
