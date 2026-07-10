# 设计说明

## 目标

在不推翻现有 HTTP 响应风格的前提下，补齐“共享响应契约”这一层，并消除一个会导致 Tuyau registry 全局退化的输入命名冲突。

## 方案

### 1. 共享响应基元放在 `packages/contracts/api`

这次不是把所有接口完整响应都塞进 `packages/contracts`，而是只上收复用价值很高的共享基元：

- `ApiSuccessResponse<T>`
- `ApiErrorResponse`
- `ApiMessageResponse`

这样做的目标是：

1. 让 HTTP `{ data }` / `{ message }` / `{ message, errors? }` 的外层壳有统一类型来源
2. 保持 `data` 内部业务字段仍由领域 contract 定义
3. 避免把 controller 状态码分支和业务 DTO 混进同一个类型层

### 2. 领域 DTO 继续留在各自子入口

登录结果、协同会话结果虽然最终会被 `ApiSuccessResponse<T>` 包裹，但 `T` 本身仍然应放回领域 contract：

- `@docweave/contracts/auth` → `LoginResultDto`
- `@docweave/contracts/collaboration` → `CollaborationSessionDto`

### 3. 修复 Tuyau registry 命名冲突

`POST /api/rag/search` 原先的请求体字段名是 `query`。在运行时这没问题，但在 Tuyau 生成 registry 时，endpoint 自身已经有一个 `query` 元字段，导致类型结构出现冲突，最终让 `createTuyau({ registry })` 推导失败。

本次直接把请求体字段更名为 `searchText`，这是最小且稳定的修法：

1. 不需要在 `tuyau-client` 层做脆弱的类型断言
2. 不会继续污染其他路由的 registry 推导
3. 和业务语义更贴近，也更容易和 URL query 参数区分

## 边界

- 不引入 `{ code, data, msg }` 三段式
- 不把页面级 lint 修复混入本 change
- 不改变当前成功/失败响应的运行时外形，只补齐契约与类型层
