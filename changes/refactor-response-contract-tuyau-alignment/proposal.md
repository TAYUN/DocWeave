# 变更提案

## 背景（Why）

当前 `refactor-api-response-envelope` 已经收口了服务端成功/失败响应的运行时风格，但本轮实现继续暴露出两个后续问题：

1. `packages/contracts` 里仍缺少可跨前后端复用的共享响应 envelope 基元，导致测试和前端 API 层反复手写 `{ data: ... }` / `{ message, errors? }`。
2. `POST /api/rag/search` 使用 `query` 作为请求体字段名，会和 Tuyau registry 的 `query` 元信息重名；一旦 registry 类型坍塌，`tuyau.api` 会整体退化成 `unknown`，进而连 `spaces` / `documents` 这类无关路由的类型也一起丢失。

这说明仅有运行时 envelope 统一还不够，仍需要再补一层“共享响应契约 + Tuyau 类型兼容”的收口，否则前端类型安全和测试契约会持续漂移。

## 变更内容（What Changes）

- 在 `packages/contracts` 新增共享响应基元：`ApiSuccessResponse<T>`、`ApiErrorResponse`、`ApiMessageResponse`
- 补齐 `LoginResultDto`、`CollaborationSessionDto` 等此前散落在调用侧的接口返回 DTO
- 将 `apps/web/src/lib/api.ts` 和相关 functional tests 切换到共享响应契约
- 将 `POST /api/rag/search` 的请求体字段从 `query` 调整为 `searchText`，修复 Tuyau registry 类型坍塌问题
- 同步更新相关架构/规划文档，明确 envelope 基元和领域 DTO 的职责边界

## 能力（Capabilities）

### 新增能力

- api-response-contract-alignment

### 修改能力

- api-response-envelope-normalization
- rag-search-scaffold
- frontend-adonis-api-client-baseline

## 范围（Scope）

### 范围内（In Scope）

- `packages/contracts` 的共享响应 envelope 基元
- `auth` / `collaboration` 的最小返回 DTO 补齐
- `apps/web/src/lib/api.ts` 的共享 envelope 复用
- `apps/api` 相关 functional tests 的响应契约复用
- `POST /api/rag/search` 请求字段更名及其相关类型修复
- 与本轮收口直接相关的文档同步

### 范围外（Out of Scope）

- 不重做现有 controller 的运行时 envelope 规则
- 不扩展为新的全局 API 网关或 transport abstraction
- 不纳入用户已单独提交的 `document-editor-page.tsx` lint 修复
- 不在本次 change 中接入真实 RAG 检索或搜索 UI

## 影响（Impact）

- 影响的代码区域：`packages/contracts`、`apps/web`、`apps/api`、`docs`
- 影响的接口：登录、协同令牌、文档索引任务、RAG 搜索的类型契约
- 影响的开发方式：前端/测试不再重复手写响应 envelope，Tuyau registry 恢复稳定推导
