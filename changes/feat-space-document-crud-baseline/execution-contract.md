# 执行合同

## Intent Lock

- **变更名称**：`feat-space-document-crud-baseline`
- **要解决的问题**：
  - 当前 `apps/web` 和 `apps/api` 已经具备读取 `spaces/documents` 的能力，但用户还不能通过页面真正创建或编辑这些元数据。
  - 如果继续停留在只读工作台骨架，项目虽然“能看数据”，却还没有形成第一条可交互的主业务闭环。
- **范围内**：
  - 为 `spaces` 提供最小创建接口与前端表单。
  - 为 `documents` 提供最小创建接口与前端表单。
  - 为 `documents` 提供最小 `summary` 编辑流程。
  - 为前后端 mutation 增加最小成功/失败反馈与刷新逻辑。
- **范围外**：
  - 不实现正式认证、权限隔离、删除/归档/拖拽、BlockNote 正文编辑、协同、AI 写入、搜索或 RAG。

## Approved Behavior

- **已批准需求摘要**：
  - `apps/api` 必须支持 `POST /api/spaces`、`POST /api/documents` 与稳定的 `PATCH /api/documents/:documentId`。
  - `apps/web` 必须提供创建 `space`、创建 `document`、编辑 `document summary` 的表单交互。
  - mutation 成功后，页面必须能刷新并反映 PostgreSQL 真实状态。
- **关键场景**：
  - 用户在页面中创建一个新 `space`，提交后可以在列表中看到它。
  - 用户在某个 `space` 下创建一个新 `document`，提交后可以导航到它。
  - 用户编辑某篇 `document` 的 `summary` 后，刷新后仍能看到保存结果。
- **验收检查**：
  - 后端写接口存在且类型检查通过。
  - 前端表单存在且构建通过。
  - 数据库记录可通过 SQL 查询确认发生真实变化。

## Design Constraints

- **架构约束**：
  - 继续复用既有 `spaces/documents` 模型和 PostgreSQL 基线，不新建并行元数据结构。
  - 当前 change 只开放元数据写入，不触碰正文结构与编辑器正文链路。
  - 当前 change 不得继续扩展到协同、AI、RAG 或正式权限体系。
- **接口约束**：
  - `space` 创建只需要最小必要字段。
  - `document` 创建至少需要 `spaceId`、`title` 和初始 `summary`。
  - `document` 更新只要求稳定支持元数据字段，尤其是 `summary`。
- **依赖约束**：
  - 继续使用现有 `TanStack Query` 进行 mutation 后刷新。
  - 继续使用 PostgreSQL，不引入新的中间存储。
- **数据约束**：
  - 当前变更只修改 `spaces` 与 `documents` 两类元数据。
  - 当前写入只针对本地开发态数据，不代表生产安全模型。

## Task Batches

### Batch 1

- **目标**：建立 `spaces/documents` 的最小写接口。
- **输入**：当前 `apps/api` 读接口、`metadata-write-api-baseline` spec、既有 PostgreSQL 模型。
- **输出**：`POST /api/spaces`、`POST /api/documents`、稳定的 `PATCH /api/documents/:documentId`。
- **完成标准**：
  - API 类型检查通过。
  - service 层具备真实写入能力。
  - 返回结构可被前端 mutation 直接消费。

### Batch 2

- **目标**：建立前端表单与 mutation 闭环。
- **输入**：Batch 1 写接口、`metadata-write-ui-flow` spec、当前 `apps/web` 路由壳。
- **输出**：create space form、create document form、edit summary form、成功/失败反馈。
- **完成标准**：
  - 前端类型检查通过。
  - 前端构建通过。
  - mutation 成功后可刷新空间/文档数据。

### Batch 3

- **目标**：验证第一条可交互元数据闭环。
- **输入**：前两批产物、本地 PostgreSQL 数据库。
- **输出**：通过真实页面/API 触发的数据变化。
- **完成标准**：
  - 创建 `space` 成功。
  - 创建 `document` 成功。
  - 编辑 `document summary` 成功。
  - SQL 查询可确认结果。

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 当前 API 若不支持创建 `space/document`，应视为写接口未落地。
  - 当前前端若没有 create/edit 表单，应视为交互闭环未落地。
  - 当前数据库若在操作后没有真实变化，应视为只完成了假交互。
- **必需的边界情况**：
  - 不能在当前 change 中偷偷接入正文编辑器或正式权限体系。
  - 不能让 mutation 成功后页面保持陈旧状态。
  - 不能让 `document` 脱离 `space` 独立创建。
- **回归敏感区域**：
  - `apps/api/app/controllers/spaces_controller.ts`
  - `apps/api/app/controllers/documents_controller.ts`
  - `apps/api/app/services/docweave_catalog_service.ts`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/router.tsx`
  - `apps/web/src/App.css`

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这条 change 的实现规模适合按 API、UI、闭环验证三批顺序推进。
  - 每批都能用明确命令和真实数据库状态做验证，不需要更重的多代理流程。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 待确认 create space、create document、edit summary 三条路径是否都已落地 |
| Correctness | Pending | 待确认写接口与前端表单是否严格对齐当前 scope |
| Coherence | Pending | 待确认页面显示、API 返回与 PostgreSQL 数据变化一致 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 后审查 API 写接口是否过度扩展。
  - Batch 2 后审查前端表单是否只覆盖当前批准范围。
  - Batch 3 后审查数据库与 UI 是否形成真实闭环。
- **阻塞类别**：
  - 当前实现扩展到 BlockNote、协同、正式认证或复杂元数据管理。
  - mutation 成功但数据库或 UI 没有真实同步变化。
  - 写接口与前端表单字段定义不一致。

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果要把删除/归档/拖拽/搜索/正文编辑一并纳入这条 change。
  - 如果要把权限校验和正式认证一并纳入写接口。
- **何时回退到 `bridging`**：
  - 如果 proposal/specs/design/tasks 更新，导致当前合同不再准确反映变更边界。
- **何时不得继续实现**：
  - 用户未明确批准本执行合同。
  - 实现试图超出“create space / create document / edit summary”三条路径。
