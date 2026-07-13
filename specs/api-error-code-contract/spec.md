# API Error Code Contract

## ADDED Requirements

### Requirement: Error envelope exposes stable error code

所有使用 `ApiErrorResponse` 的 HTTP 错误响应 MUST 能承载稳定错误码字段。

#### Scenario: validation failure carries stable code

- **WHEN** API 因 Vine 校验失败返回 422
- **THEN** 响应体包含 `code = VALIDATION_FAILED`
- **AND** 响应体保留 `message`
- **AND** 响应体保留 `errors[]`

#### Scenario: explicit controller 404 carries domain-specific code

- **WHEN** 控制器明确返回“文档不存在”或“空间不存在”
- **THEN** 响应体包含对应领域错误码
- **AND** 前端不需要通过匹配 message 文本来区分文档和空间

### Requirement: Frontend consumes code before message

前端 API 收口层 MUST 优先基于 `ApiErrorResponse.code` 归一化错误语义。

#### Scenario: code exists

- **WHEN** 前端收到带 `code` 的错误响应
- **THEN** 前端优先用 `code` 解析稳定中文错误信息
- **AND** `message` 仅作为兼容或展示兜底

#### Scenario: old response has no code

- **WHEN** 前端收到没有 `code` 的旧错误响应
- **THEN** 前端仍能回退到 `message` / fallback
- **AND** 不因为缺少 `code` 导致页面崩溃

### Requirement: Contract does not become UI copy registry

`packages/contracts` MUST 只承载错误码与 envelope 结构，不承载产品级展示文案常量。

#### Scenario: contract remains semantic

- **WHEN** 维护者查看 `packages/contracts`
- **THEN** 能看到稳定错误码类型与 response shape
- **AND** 不需要在 contract 层维护整套中文产品 copy
