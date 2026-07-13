# 实现任务

## 文件结构

- `Modify: packages/contracts/src/api.ts` — 新增 `ApiErrorCode`，扩展 `ApiErrorResponse`
- `Modify: packages/contracts/src/index.ts` — 暴露新的错误码类型
- `Add: packages/shared/src/api-messages.ts` / `src/index.ts` / `package.json` — 新增前后端共享的错误目录常量
- `Modify: apps/api/app/exceptions/*` — 收口错误码常量、默认文案与 handler 映射
- `Modify: apps/api/app/controllers/*` — 让显式错误响应携带 `code`
- `Modify: apps/api/app/services/*` / `app/application/*` — 领域异常改为使用统一错误码语义
- `Modify: apps/web/src/lib/api.ts` — 优先按 `code` 归一化错误
- `Modify: apps/api/tests/functional/*.spec.ts` — 为 `code` 增加断言
- `Modify: docs/architecture/05.*` / `docs/workflow/frontend-adonis-api-client-guide.md` — 同步契约边界

## 接口

### Shared API Error Envelope

- **Error**: `{ code?: ApiErrorCode, message?: string, errors?: ApiErrorItem[] }`
- **兼容策略**: 前端优先消费 `code`，若缺失则回退到 `message`

## 1. Batch 1: 错误码契约建模

Depends on: None

- [x] 在 `packages/contracts` 定义 `ApiErrorCode`
- [x] 扩展 `ApiErrorResponse` 的 `code` 字段
- [x] 在 `packages/shared` 建立共享错误目录常量
- [x] 设计并落地后端统一错误码目录与默认中文文案映射
- [x] 更新文档，明确“错误码进 contract、展示文案不进 contract”的边界

## 2. Batch 2: HTTP / 前端接线

Depends on: Batch 1

- [x] 让 `HttpExceptionHandler` 输出 `code + message`
- [x] 让控制器显式错误响应补齐 `code`
- [x] 让前端 API 收口层优先基于 `code` 做错误归一化
- [x] 清理前后端重复的错误文案常量与英文识别逻辑

## 3. Batch 3: 验证与收口

Depends on: Batch 2

- [x] 更新/新增功能测试断言 `code`
- [x] 跑后端功能测试与前端类型检查
- [x] 确认 change 工件、状态文件与验证结果一致

## 验收记录

- [x] `pnpm --dir apps/api typecheck`
- [x] `pnpm --dir "D:\\code-my\\DocWeave\\apps\\web" exec tsc --noEmit`
- [x] `pnpm --dir apps/api test --files tests/functional/api_response_envelope.spec.ts`
- [x] `pnpm --dir apps/api test --files tests/functional/document_processing_mcp_tools.spec.ts`
- [x] `pnpm --dir apps/api test --files tests/functional/collaboration_runtime_flow.spec.ts`
