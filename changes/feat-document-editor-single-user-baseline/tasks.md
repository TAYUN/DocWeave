# 实现任务

## 文件结构

- `Modify: apps/web/package.json` — 增加 BlockNote 前端依赖
- `Modify: apps/web/src/router.tsx` — 文档页接入单人编辑器
- `Create: packages/editor/*` — 最小编辑器共享封装入口
- `Modify: apps/api/start/routes.ts` — 增加正文读取/保存接口或对现有文档接口扩展
- `Modify: apps/api/app/controllers/documents_controller.ts` — 承接正文读写
- `Modify: apps/api/app/services/docweave_catalog_service.ts` — 增加正文内容持久化逻辑

## 接口

### Web → API

- **Consumes**: document content read endpoint
- **Consumes**: document content save endpoint

### Web → Shared Package

- **Consumes**: `packages/editor` reusable editor entrypoint

### API → PostgreSQL

- **Consumes**: document content persistence field or equivalent storage boundary

## 1. Batch 1: 建立正文持久化承接位

- [x] **1.1 编写失败的测试**

```text
检查当前 document 只有元数据，没有正文读写能力。
```

- [x] **1.2 运行测试并确认失败**

Run: `pnpm typecheck:api`
Expected: 当前 API 尚未提供正文持久化能力

- [x] **1.3 实现最小化代码**

```text
实现文档正文读取与保存的最小 API/服务边界
```

- [x] **1.4 运行测试并确认通过**

Run: `pnpm typecheck:api`
Expected: PASS

## 2. Batch 2: 接入 BlockNote 单人编辑器

- [x] **2.1 编写失败的测试**

```text
检查当前文档页没有真实 BlockNote 编辑器。
```

- [x] **2.2 运行测试并确认失败**

Run: `pnpm typecheck:web`
Expected: 当前前端尚未具备单人编辑器能力

- [x] **2.3 实现最小化代码**

```text
实现：
- BlockNote editor package entry
- document page editor rendering
- load/save wiring
```

- [x] **2.4 运行测试并确认通过**

Run:
- `pnpm typecheck:web`
- `pnpm build:web`

Expected: PASS

## 3. Batch 3: 验证单人编辑闭环

- [x] **3.1 编写失败的测试**

```text
检查正文编辑后刷新页面不会保留修改。
```

- [x] **3.2 运行测试并确认失败**

Run: `pnpm check:workspace`
Expected: 当前还不能证明单人正文编辑已闭环

- [x] **3.3 实现最小化代码**

```text
通过页面编辑正文、保存并刷新，确认内容可重载
```

- [x] **3.4 运行测试并确认通过**

Run:
- `pnpm check:workspace`
- manual scenario verification

Expected: PASS
