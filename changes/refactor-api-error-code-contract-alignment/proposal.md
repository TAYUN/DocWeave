# 变更提案

## 背景（Why）

当前后端与前端已经把大量英文错误提示收口成中文，但这套实现仍主要依赖 `message` 文本本身：

1. `packages/contracts` 里的 `ApiErrorResponse` 只有 `message` / `errors`，没有稳定错误码。
2. `apps/api` 与 `apps/web` 为了兜底旧英文提示，各自维护了一份“英文文案 -> 中文文案”的映射。
3. 一旦后端文案调整、未来引入多语言，或 MCP / HTTP / 浏览器网络层混入新的错误来源，前端仍可能因为只看文案而产生漂移。

这说明真正应当进入跨边界稳定承诺层的，不是中文展示文案，而是“稳定错误码”。如果继续只共享 message，后续维护成本会持续升高。

## 变更内容（What Changes）

- 在 `packages/contracts` 为 `ApiErrorResponse` 增加稳定错误码字段 `code`
- 定义统一的 `ApiErrorCode` 枚举类型，覆盖当前已收口的核心错误语义
- 在 `packages/shared` 新增前后端共享的错误目录常量，统一承载“错误码 -> 默认中文文案”的运行时映射
- 将 `apps/api` 的异常处理、控制器分支与领域错误统一映射到 `code + message`
- 将 `apps/web/src/lib/api.ts` 改为优先基于 `code` 做错误归一化，`message` 仅作为兼容兜底
- 清理前后端重复的错误文案常量与英文兜底映射，明确“contract 承载错误语义，shared 承载共享运行时目录，message 承载默认展示文案”的边界
- 补充相关测试与文档，明确这套数据契约约定，方便后续维护

## 能力（Capabilities）

### 新增能力

- api-error-code-contract

### 修改能力

- api-response-envelope-normalization
- frontend-adonis-api-client-baseline

## 范围（Scope）

### 范围内（In Scope）

- `packages/contracts/src/api.ts` 的错误契约升级
- `packages/shared` 的共享错误目录常量
- `apps/api` HTTP 错误 envelope 的 `code` 对齐
- `apps/web/src/lib/api.ts` 的错误解析与归一化收口
- 与错误码契约直接相关的 functional tests / type checks / 文档同步

### 范围外（Out of Scope）

- 不在本次 change 中引入完整多语言/i18n 方案
- 不重做成功响应 envelope
- 不把所有 UI 文案搬进 `packages/contracts`
- 不处理已单独隔离的 `feat-m6-rag-search-chat-baseline`

## 影响（Impact）

- 影响的代码区域：`packages/contracts`、`packages/shared`、`apps/api`、`apps/web`、`docs`
- 影响的接口：所有使用 `ApiErrorResponse` 的 HTTP API
- 影响的开发方式：后续新增错误时，需要优先新增/复用 `ApiErrorCode`，并在 `packages/shared` 的共享目录中补齐默认文案，而不是继续在前后端各自拼新的 message 常量
