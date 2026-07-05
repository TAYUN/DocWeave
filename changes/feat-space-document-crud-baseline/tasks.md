# 实现任务

## 文件结构

- `Modify: apps/api/start/routes.ts` — 增加 `POST /api/spaces` 与 `POST /api/documents`
- `Modify: apps/api/app/controllers/spaces_controller.ts` — 支持创建 space
- `Modify: apps/api/app/controllers/documents_controller.ts` — 支持创建 document 与稳定编辑 summary
- `Modify: apps/api/app/services/docweave_catalog_service.ts` — 增加写接口
- `Modify: apps/web/src/lib/api.ts` — 增加 create/update mutation 调用
- `Modify: apps/web/src/router.tsx` — 增加 create/edit 表单与刷新逻辑
- `Modify: apps/web/src/App.css` — 增加表单与反馈样式

## 接口

### Web → API

- **Consumes**: `POST /api/spaces`
- **Consumes**: `POST /api/documents`
- **Consumes**: `PATCH /api/documents/:documentId`

### API → PostgreSQL

- **Consumes**: `spaces` insert
- **Consumes**: `documents` insert/update

## 1. Batch 1: 建立写接口

- [x] **1.1 编写失败的测试**

```text
检查当前 API 不支持创建 space/document，也没有稳定的 summary 编辑闭环。
```

- [x] **1.2 运行测试并确认失败**

Run: `pnpm typecheck:api`
Expected: 在写接口补齐前，当前 change 的目标能力尚不存在

- [x] **1.3 实现最小化代码**

```text
实现：
- POST /api/spaces
- POST /api/documents
- PATCH /api/documents/:documentId
```

- [x] **1.4 运行测试并确认通过**

Run: `pnpm typecheck:api`
Expected: PASS

## 2. Batch 2: 建立表单与 mutation 闭环

- [x] **2.1 编写失败的测试**

```text
检查当前前端没有创建 space、创建 document、编辑 summary 的表单交互。
```

- [x] **2.2 运行测试并确认失败**

Run: `pnpm typecheck:web`
Expected: 当前 UI 不具备写入能力

- [x] **2.3 实现最小化代码**

```text
实现：
- create space form
- create document form
- edit summary form
- success/error feedback
- query refresh
```

- [x] **2.4 运行测试并确认通过**

Run:
- `pnpm typecheck:web`
- `pnpm build:web`

Expected: PASS

## 3. Batch 3: 验证第一条可交互闭环

- [x] **3.1 编写失败的测试**

```text
检查当前数据库数据不会因为页面操作而变化。
```

- [x] **3.2 运行测试并确认失败**

Run: `psql -h 127.0.0.1 -p 5432 -U root -d docweave -c "SELECT count(*) FROM spaces;"`
Expected: 在写入前，记录数不增长

- [x] **3.3 实现最小化代码**

```text
通过 UI 或对应 API 调用：
- 创建一个新 space
- 创建一个新 document
- 编辑一个 document summary
```

- [x] **3.4 运行测试并确认通过**

Run:
- `pnpm check:workspace`
- `psql -h 127.0.0.1 -p 5432 -U root -d docweave -c "SELECT id, name FROM spaces ORDER BY id;"`
- `psql -h 127.0.0.1 -p 5432 -U root -d docweave -c "SELECT id, title, summary FROM documents ORDER BY id;"`

Expected: PASS
