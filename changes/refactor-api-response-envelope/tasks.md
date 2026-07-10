# 实现任务

## 文件结构

- `Modify: docs/architecture/05. 数据契约与适配层设计.md` — 明确 response envelope 不属于 `packages/contracts` 的默认职责
- `Modify: docs/workflow/frontend-adonis-api-client-guide.md` — 明确统一响应风格和前端错误收口规则
- `Modify: apps/api/app/exceptions/handler.ts` — 统一 JSON 错误响应外形
- `Modify: apps/api/providers/api_provider.ts` — 复核并保持成功响应 `{ data }` 包裹约定
- `Modify: apps/api/app/controllers/auth_controller.ts` — 对齐 success envelope
- `Modify: apps/api/app/controllers/spaces_controller.ts` — 对齐 success envelope
- `Modify: apps/api/app/controllers/documents_controller.ts` — 对齐 success envelope
- `Modify: apps/api/app/controllers/collaboration_tokens_controller.ts` — 补 validator 或最小请求校验，并对齐 envelope
- `Modify: apps/api/app/controllers/ai_editor_controller.ts` — 对齐 envelope
- `Modify: apps/api/app/controllers/rag_controller.ts` — 对齐 envelope
- `Modify: apps/web/src/lib/api.ts` — 统一错误提取与 Query 友好抛错
- `Create or Modify: apps/api/tests/functional/*` — 为成功响应和错误 envelope 增加回归验证

## Interfaces

### Response Convention

- **Success Read**: `{ data: T }`
- **Success Write**: `{ message: string, data: T }`
- **Success Empty**: `{ message: string }`
- **Error**: `{ message: string, errors?: ValidationIssue[] }`

### Frontend Internal

- **Produces**: `request function -> Promise<T>`
- **Throws**:
  - `AuthError` for `401`
  - `Error(message)` for other API failures

## 1. Batch 1: 规范和异常边界收口

- **Depends on**: Batch 0
- **Files**: `docs/...`, `apps/api/app/exceptions/handler.ts`
- **Interfaces**:
  - Consumes：现有 Adonis exception flow、文档中的 contract / Tuyau 职责说明
  - Produces：统一 envelope 规范、统一错误外形
- [x] **1.1 编写失败测试**
  - 为校验失败、未认证访问和业务错误补最小 functional test，先证明当前 JSON 外形不统一。
- [x] **1.2 运行测试并确认失败**
  - Run: `pnpm --dir apps/api test --files tests/functional`
  - Expected: 至少一个针对错误外形的新断言失败。
- [x] **1.3 实现最小化代码**
  - 在 `handler.ts` 中统一错误 JSON，并补文档约定。
- [x] **1.4 运行测试并确认通过**
  - Run: `pnpm --dir apps/api test --files tests/functional`
  - Expected: PASS
- [x] **1.5 整理与复核**
  - 确认 envelope 规则已经在文档和异常出口两处收口，没有再把职责写回 `packages/contracts`。

## 2. Batch 2: 成功响应与请求校验统一

- **Depends on**: Batch 1
- **Files**: `apps/api/providers/api_provider.ts`, `apps/api/app/controllers/*`
- **Interfaces**:
  - Consumes：统一 envelope 规则
  - Produces：稳定的 `{ data }` / `{ message, data }` / `{ message }`
- [x] **2.1 编写失败测试**
  - 为主链路控制器成功响应补断言，先证明当前存在混合外形或无 validator 的裸 `request.only(...)`。
- [x] **2.2 运行测试并确认失败**
  - Run: `pnpm --dir apps/api test --files tests/functional`
  - Expected: 当前成功响应或请求校验断言不完整/失败。
- [x] **2.3 实现最小化代码**
  - 统一主链路控制器成功响应；对当前裸请求的控制器补最小 validator 或等价安全校验。
- [x] **2.4 运行测试并确认通过**
  - Run: `pnpm --dir apps/api test --files tests/functional`
  - Expected: PASS
- [x] **2.5 轻量复核**
  - 检查 `/api/auth/*`、`spaces/documents`、`collaboration/token`、`rag/*`、`ai/editor` 的 success/error 风格一致。

## 3. Batch 3: 前端 API 层与 Query 友好错误收口

- **Depends on**: Batch 2
- **Files**: `apps/web/src/lib/api.ts`, optional web callers if needed
- **Interfaces**:
  - Consumes：统一后的 HTTP envelope
  - Produces：Query 友好的 `return data / throw error`
- [x] **3.1 编写失败测试**
  - 先用类型检查和最小单元断言证明 `errors[]` 还不能稳定转成 `message`。
- [x] **3.2 运行测试并确认失败**
  - Run:
    - `pnpm --dir apps/web exec tsc -b --pretty false`
    - optional targeted test command if the repo already has one
  - Expected: 至少一个错误归一化断言失败或实现缺失。
- [x] **3.3 实现最小化代码**
  - 在 `api.ts` 统一提取 `message` / `errors[0].message`，保持 `AuthError` 分支。
- [x] **3.4 运行测试并确认通过**
  - Run:
    - `pnpm --dir apps/web exec tsc -b --pretty false`
    - `pnpm --dir apps/api test --files tests/functional`
  - Expected: PASS
- [x] **3.5 收口检查**
  - 确认 TanStack Query 侧只需要消费 `data` / `error.message`，页面层不再关心服务端 envelope 细节。
