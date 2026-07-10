# 技术设计

## Context

- 当前 `packages/contracts` 已经稳定承载 DTO / input contract，但没有承载 HTTP response envelope。
- 当前文档已经把职责拆成：
  - `contracts` 负责跨边界 DTO / input / payload
  - `adapters` 负责 shape 转换
  - `controllers` 负责 HTTP 语义
  - `apps/web/src/lib/api.ts` 负责前端统一 API 封装
- `apps/api/providers/api_provider.ts` 已具备把 `serialize(...)` 包成 `{ data }` 的能力。
- `apps/api/app/exceptions/handler.ts` 仍基本维持默认行为，导致校验异常、认证异常和手写业务错误的 JSON 外形并不完全一致。

## Goals

- 保留 HTTP 状态码作为主语义，不额外引入业务 `code` 字段。
- 让成功响应外形可预测，减少控制器和前端查询层分支。
- 让错误响应统一到前端可稳定消费的 `{ message, errors? }`。
- 把 envelope 规则放到对的地方：文档、controller / serializer、exception handler，而不是误塞进业务 DTO 层。

## Decisions

### 决策 1：不采用 `{ code, data, msg }`，继续采用 HTTP 状态码 + JSON body

- **选择**：
  - 成功通过 `2xx` 状态码表达，失败通过 `4xx/5xx` 状态码表达。
  - body 只承载 payload 和可读错误信息，不重复维护一套业务 `code`。
- **理由**：
  - 当前栈是 `AdonisJS + Tuyau + TanStack Query`，这套组合天然更适合 `return data / throw error` 模式。
  - 现有代码已经默认依赖 HTTP 状态码和异常抛出语义，再加 `code` 只会制造第二套状态来源。
- **备选方案**：
  - 全量切换为 `{ code, data, msg }`
- **不选原因**：
  - 与 Adonis 默认异常模型不一致，需要在所有异常出口重复包装。
  - 不能减少 Query 层复杂度，反而增加额外判断。

### 决策 2：成功响应统一为三种最小外形

- **选择**：
  - 读接口默认返回 `{ data }`
  - 写接口默认返回 `{ data, message }`
  - 无 payload 的成功响应返回 `{ message }`
- **理由**：
  - 当前仓库已经大致沿这三个外形在走，直接收口最省改动。
  - `api_provider.ts` 已经可以帮助 `serialize(...)` 统一 `{ data }` 包裹。
- **备选方案**：
  - 所有成功响应一律 `{ data, message? }`
- **不选原因**：
  - 对 `logout`、健康检查等无 payload 场景没有明显收益，只会补空壳。

### 决策 3：错误响应统一为 `{ message, errors? }`

- **选择**：
  - 简单业务错误：`{ message }`
  - 字段校验错误：`{ message, errors }`
  - 框架异常在 `handler.ts` 中归一化为同一外形
- **理由**：
  - 这能兼容 TanStack Query 的 `error.message`，也兼容表单场景对字段错误列表的需要。
  - 只需要在 `handler.ts` 集中改一处，不必每个 controller 各自理解框架异常结构。
- **备选方案**：
  - 保留 Adonis 默认异常 JSON，不做统一
- **不选原因**：
  - 前端要继续到处猜 `message`、`errors`、`status`，Query 和表单都不稳。

### 决策 4：envelope 规范不下沉到 `packages/contracts`

- **选择**：
  - 在文档中明确：`packages/contracts` 负责 `data` 里的业务 shape，不负责默认 HTTP 响应壳。
  - 如果后续确实需要共享 envelope type，只允许补薄类型，不让其成为主规范入口。
- **理由**：
  - 当前仓库已经把 contract 定义为 business contract；强行扩职责会混淆 `business contract` 和 `transport envelope`。
- **备选方案**：
  - 在 `packages/contracts` 新增 `ApiSuccess<T>` / `ApiFailure`
- **不选原因**：
  - 现在先把规范和运行时收口点立住更重要，过早抽类型容易只得到另一个“类型仓库”。

## Response Policy

### Success

#### Read

```json
{ "data": {} }
```

#### Write With Payload

```json
{ "message": "Document updated", "data": {} }
```

#### Write Without Payload

```json
{ "message": "Logged out successfully" }
```

### Error

#### Business Error

```json
{ "message": "Document not found" }
```

#### Validation Error

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "title",
      "message": "The title field is required"
    }
  ]
}
```

## Implementation Shape

- `apps/api/providers/api_provider.ts`
  - 保持成功序列化的 `{ data }` 包裹能力
- `apps/api/app/controllers/*`
  - 尽量统一用 `serialize(...)` 返回成功 payload
  - 手写业务错误时返回 `{ message }`
- `apps/api/app/exceptions/handler.ts`
  - 统一 `validation/auth/authz/not-found/internal` 的 JSON 错误外形
- `apps/web/src/lib/api.ts`
  - 继续对页面暴露“成功返回 data，失败抛 Error/AuthError”
  - 新增 `errors[]` 到 `message` 的收口逻辑
- 文档
  - 在数据契约和前后端 API guide 中明确 envelope 归属

## Risks And Trade-Offs

- 风险：统一异常处理器可能影响当前测试中对默认异常结构的隐式依赖
  - 缓解措施：补 API functional test，明确校验失败和认证失败外形
- 风险：部分控制器仍混用手写 `{ data }` 和 `serialize(...)`
  - 缓解措施：优先统一 `/api/*` 已挂载主链路，先不碰未使用控制器
- 权衡：本次不把 envelope 抽进 `packages/contracts`
  - 说明：先把运行时和文档收稳，后续只有在多端确实需要共享 envelope type 时再补薄类型
