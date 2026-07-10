# 执行合同

## Intent Lock

- **变更名称**：`refactor-api-response-envelope`
- **要解决的问题**：
  - 当前 `/api/*` 响应风格只形成了弱约定，没有形成统一 envelope 和统一错误出口，导致前端 API 层需要额外猜测错误结构，后续接口扩展也容易漂移。
- **范围内**：
  - 成功响应统一为 `{ data }` / `{ message, data }` / `{ message }`
  - 错误响应统一为 `{ message, errors? }`
  - 统一主链路控制器、异常处理器和前端 `api.ts`
  - 文档明确 envelope 职责不属于 `packages/contracts` 默认职责
- **范围外**：
  - `{ code, data, msg }` 三段式协议
  - 新的 API 网关/响应中间层
  - 权限模型、RAG 真能力、AI 真能力、协同协议重构

## Approved Behavior

- **已批准需求摘要**：
  - 系统继续基于 HTTP 状态码表达成功/失败，不额外引入业务 `code`
  - 读接口返回 `{ data }`
  - 写接口返回 `{ message, data }`
  - 无 payload 成功返回 `{ message }`
  - 错误返回 `{ message, errors? }`
  - 前端 Query 层继续只消费 `data` 和 `error.message`
- **关键场景**：
  - 校验失败返回统一 `422 + { message, errors }`
  - 未认证访问返回统一 `401 + { message }`
  - `documents/spaces/auth` 成功返回遵守新外形
  - `api.ts` 能从 `message` 或 `errors[0].message` 提取错误文案
- **验收检查**：
  - 主链路控制器不再出现多套成功 envelope
  - `handler.ts` 能统一框架异常 JSON
  - `packages/contracts` 文档职责保持 business contract，不变成 envelope 中心

## Design Constraints

- **架构约束**：
  - 成功 envelope 优先复用现有 `serialize(...)` / `ApiSerializer`
  - 错误 envelope 优先集中在 `handler.ts`
  - 不在 controller 之外新增额外 transport abstraction
- **接口约束**：
  - 前端只通过 `apps/web/src/lib/api.ts` 暴露统一错误语义
  - 当前已挂载 `/api/*` 路由优先全部对齐
- **依赖约束**：
  - 不新增依赖
  - 继续使用 Adonis、Tuyau、TanStack Query 现有基线

## Task Batches

### Batch 1

- **目标**：锁定 envelope 规范并统一框架异常输出
- **输入**：
  - `proposal.md`
  - `design.md`
  - `specs/api-response-envelope-normalization/spec.md`
- **输出**：
  - 文档约定
  - `handler.ts` 统一错误 JSON
- **完成标准**：
  - `401/422/404/500` 至少具备统一 `{ message, errors? }` 外形

### Batch 2

- **目标**：统一主链路控制器成功响应和最小请求校验
- **输入**：
  - Batch 1 错误外形
- **输出**：
  - 主链路 success envelope 统一
  - 裸 `request.only(...)` 入口收紧
- **完成标准**：
  - `/api/auth/*`、`spaces/documents`、`collaboration/token`、`rag/*`、`ai/editor` 响应风格一致

### Batch 3

- **目标**：统一前端 API 错误收口并验证 Query 友好性
- **输入**：
  - Batch 2 HTTP envelope
- **输出**：
  - `apps/web/src/lib/api.ts` 统一错误提取
  - 回归验证
- **完成标准**：
  - 调用层继续 `return data / throw error`

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 校验失败错误外形
  - 未认证错误外形
  - 成功响应 envelope
- **必需的边界情况**：
  - `errors[]` 缺失时仍有 fallback message
  - 业务错误和框架错误都能返回稳定 `message`
- **回归敏感区域**：
  - 登录/登出/当前用户
  - 文档保存
  - 协同令牌获取

## Execution Mode

- **模式**：`SDD`
- **选择理由**：
  - 这次改动跨 `docs`、`apps/api`、`apps/web` 和 functional tests，属于统一协议和入口行为的跨模块收口，不适合当作单文件 tweak。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | — |
| Correctness | Pending | — |
| Coherence | Pending | — |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 后确认 envelope 职责归位，没有误塞进 `packages/contracts`
  - Batch 2 后确认 success envelope 已统一
  - Batch 3 后确认前端 Query 调用方式未变复杂
- **阻塞类别**：
  - handler 无法安全统一框架异常
  - 主链路控制器响应风格仍混乱
  - 前端仍要在页面层分辨多种错误外形

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果需要把 envelope 抽象成跨端共享响应协议，并要求 `packages/contracts` 正式接管
- **何时回退到 `bridging`**：
  - 如果实现中发现现有 Adonis 例外处理机制无法在不破坏主链路的前提下统一 JSON 外形
- **何时不得继续实现**：
  - 如果 functional test 表明统一 handler 会破坏现有登录/文档保存主链路且当前范围内无法修复
