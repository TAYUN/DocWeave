# 实现任务

## 文件结构

- `Add: packages/contracts/src/api.ts` — 新增共享响应 envelope 基元
- `Modify: packages/contracts/src/auth.ts` — 补齐登录返回 DTO
- `Modify: packages/contracts/src/collaboration.ts` — 补齐协同会话返回 DTO
- `Modify: packages/contracts/src/index.ts` / `package.json` — 暴露新的 contracts 子入口
- `Modify: apps/web/src/lib/api.ts` — 改为复用共享响应契约
- `Modify: apps/api/tests/functional/*.spec.ts` — 改为复用共享响应契约
- `Modify: apps/api/app/controllers/collaboration_tokens_controller.ts` — 统一使用 serializer 返回协同响应
- `Modify: apps/api/app/services/collaboration_token_service.ts` — 直接返回 `CollaborationSessionDto`
- `Modify: apps/api/app/validators/runtime.ts` / `app/controllers/rag_controller.ts` — 将 RAG 搜索请求体字段更名为 `searchText`
- `Modify: docs/architecture/03.*`, `05.*`, `docs/planning/23.*`, `51.*` — 同步契约职责与字段命名约定

## 接口

### Shared API Envelope

- **Success**: `ApiSuccessResponse<T>`
- **Error**: `ApiErrorResponse`
- **Message-only**: `ApiMessageResponse`

### RAG Search HTTP

- **Consumes**: `POST /api/rag/search` with `{ searchText: string }`
- **Produces**: `{ data: RagSearchResult }`

## 1. Batch 1: 共享响应契约收口

Depends on: None

- [x] 新增 `packages/contracts/src/api.ts`，定义共享响应 envelope 基元
- [x] 补齐 `LoginResultDto` 与 `CollaborationSessionDto`
- [x] 修改 `apps/web/src/lib/api.ts`，改为复用共享 envelope
- [x] 修改相关 functional tests，避免重复定义本地 `{ data: ... }`

## 2. Batch 2: Tuyau registry 类型修复

Depends on: Batch 1

- [x] 将 `POST /api/rag/search` 的请求体字段从 `query` 调整为 `searchText`
- [x] 重新生成并验证 Tuyau registry 类型恢复稳定
- [x] 更新相关文档与测试断言

## 验收记录

- [x] `pnpm --dir apps/web exec tsc -b --pretty false`
- [x] `pnpm --dir apps/api typecheck`
- [x] `pnpm check:workspace`
- [x] `pnpm --dir apps/api exec node ace test --files tests/functional/api_response_envelope.spec.ts`
- [x] `pnpm --dir apps/api exec node ace test --files tests/functional/document_index_job_flow.spec.ts --files tests/functional/collaboration_token_flow.spec.ts`
