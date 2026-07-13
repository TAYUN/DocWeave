# 设计说明

## 目标

让“错误语义”进入稳定数据契约层，让“默认中文文案”仍由服务端返回，但不再作为前后端联动的唯一依据。

## 设计原则

1. `contract` 承载稳定错误语义，不承载产品展示 copy。
2. `packages/shared` 承载前后端共同需要的运行时错误目录常量。
3. `apps/api` 负责把异常映射为 `status + code + message`。
4. `apps/web` 负责优先按 `code` 做消费层归一化，`message` 作为兼容与展示兜底。
5. 校验明细 `errors[]` 保留原结构，但顶层 `message` 与 `code` 必须一致表达同一语义。

## 契约方案

在 `packages/contracts/src/api.ts` 中引入：

- `ApiErrorCode`
- `ApiErrorResponse['code']`

推荐把错误码命名为稳定、语义化、与 transport 无关的全大写蛇形：

- `VALIDATION_FAILED`
- `AUTH_UNAUTHORIZED`
- `AUTH_FORBIDDEN`
- `RESOURCE_NOT_FOUND`
- `SPACE_NOT_FOUND`
- `DOCUMENT_NOT_FOUND`
- `DOCUMENT_PATCH_EMPTY`
- `DOCUMENT_STABLE_SNAPSHOT_MISSING`
- `DOCUMENT_SNAPSHOT_NOT_FOUND`
- `COLLAB_TOKEN_FORMAT_INVALID`
- `COLLAB_TOKEN_SIGNATURE_INVALID`
- `COLLAB_TOKEN_EXPIRED`
- `COLLAB_RUNTIME_UNAUTHORIZED`
- `EDITOR_AI_REQUEST_INVALID`
- `EDITOR_AI_DOCUMENT_NOT_FOUND`
- `EDITOR_AI_PROVIDER_CONFIG_MISSING`
- `AI_PROVIDER_EMPTY_STREAM`
- `PAGINATION_METADATA_INVALID`
- `INTERNAL_SERVER_ERROR`

这里允许“通用码 + 领域细分码”并存：例如 404 既可以有 `RESOURCE_NOT_FOUND`，也允许控制器在已知领域语义下返回 `DOCUMENT_NOT_FOUND` / `SPACE_NOT_FOUND`。

## 共享目录方案

在 `packages/shared/src/api-messages.ts` 中集中维护：

1. `apiErrors`
2. `apiErrorsByCode`
3. `apiSuccessMessages`
4. `mcpMessages`
5. `getApiErrorDefinitionByCode`

这样可以保证：

1. `packages/contracts` 继续只负责稳定类型契约
2. `apps/api` 与 `apps/web` 不再重复维护同一份默认文案
3. 以后若还出现“前后端都要用到的运行时共享常量”，可以继续沿着 `packages/shared` 扩展，而不是把实现细节塞回 contract

## 后端映射策略

在 `apps/api` 新增统一错误处理 wrapper，并复用 `packages/shared` 的共享目录，收口：

1. 共享错误目录的后端导出入口
2. 已知英文旧错误 -> 错误码 / 中文文案 的兼容翻译
3. `ApiContractError` 与 `toApiErrorResponse(...)` 这类后端专用 helper

`HttpExceptionHandler` 输出规则：

- 优先取 payload 中已有 `code`
- 否则根据领域异常 / status / 已知 message 推导 `code`
- 再根据 `code` 解析默认中文 `message`

控制器显式返回的 4xx 分支也统一携带 `code`，避免局部绕过 handler 时丢失契约。

## 前端消费策略

`apps/web/src/lib/api.ts` 保留统一 API 收口层，但调整为：

1. 优先读 `payload.code`
2. 通过 `packages/shared` 的共享错误目录生成稳定中文 message
3. 若 `code` 缺失，则回退到现有 `message`
4. 仅在再无有效信息时使用 fallback

这样做的收益是：

1. 后端 message 调整不会破坏前端识别
2. 未来接 i18n 时，只需替换 `code -> 文案` 映射
3. HTTP / Tuyau / fetch 三条错误来源都能收口到同一套语义

## 迁移策略

本次采用“兼容升级”：

1. 先给 contract 增加可选 `code`
2. 后端逐步补齐所有已知 error response 的 `code`
3. 前端优先使用 `code`，兼容旧 `message`

这样不会打断当前页面和测试，也便于后续其他域逐步接入。
