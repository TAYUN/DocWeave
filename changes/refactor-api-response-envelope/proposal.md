# 变更提案

## Why

当前 `apps/api` 的响应风格已经形成了部分共识，但还没有被真正收口成统一约定。

- 成功响应同时存在 `{ data }`、`{ message, data }`、`{ message }`
- 业务错误通常是手写 `{ message }`
- `validateUsing(...)`、认证失败等框架异常仍会落回 Adonis 默认 JSON 结构
- 前端 `apps/web/src/lib/api.ts` 已经在帮页面兜底，但它主要依赖 `message`，对 `errors[]` 这类默认异常结构没有系统收口

这让当前系统处在“主链路勉强能跑，但响应协议仍靠约定”的状态。随着 `auth`、`documents`、`spaces`、`collaboration`、`rag`、`ai` 继续扩展，前后端会越来越依赖统一错误和成功外形，否则 TanStack Query、表单错误展示和后续接口扩展都会重复写转换逻辑。

## What Changes

- 明确 DocWeave 的统一接口响应风格，不采用 `{ code, data, msg }` 三段式，而继续基于 HTTP 状态码表达成功/失败语义。
- 统一成功响应为 `{ data }` 或 `{ data, message }`，无 payload 的成功响应统一为 `{ message }`。
- 统一错误响应为 `{ message, errors? }`，并在全局异常处理器中收口校验、认证、授权和兜底异常。
- 按统一后的风格优化 `apps/api` 控制器、异常处理器和 `apps/web/src/lib/api.ts` 的错误归一化逻辑。
- 为核心接口补回归验证，避免主链路和 Query 层行为回退。

## Capabilities

### 新增能力

- api-response-envelope-normalization

### 修改能力

- auth-session-current-user-baseline
- api-metadata-route-baseline
- collaboration-token-issuance-baseline

## Scope

### In Scope

- `apps/api` 控制器成功响应外形统一
- `apps/api/app/exceptions/handler.ts` 统一 JSON 错误响应外形
- `apps/api/providers/api_provider.ts` 继续承担成功响应 data 包裹能力
- `apps/web/src/lib/api.ts` 统一提取 `message` / `errors[]`
- `documents` / `spaces` / `auth` / `collaboration` / `rag` / `ai` 当前已挂载路由的响应风格收口
- 面向团队的文档补充，明确 envelope 职责不放在 `packages/contracts`

### Out of Scope

- 不引入 `{ code, data, msg }` 三段式协议
- 不重构 `packages/contracts` 为全局 HTTP envelope 类型中心
- 不在本次 change 中引入新的 API 网关、中间层或响应 DSL
- 不顺手做权限模型、RAG 真实能力或 AI 编辑真实编排

## Impact

- 影响的代码区域：`apps/api`、`apps/web`、`docs`
- 影响的 API 或接口：当前 `/api/*` 已挂载 HTTP 接口的成功与错误响应外形
- 影响的用户路径：登录、工作台加载、文档读取/保存、协同令牌获取、RAG/AI 占位接口错误展示
