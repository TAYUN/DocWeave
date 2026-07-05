# 执行合同

## Intent Lock

- **变更名称**：`feat-document-editor-single-user-baseline`
- **要解决的问题**：
  - `feat-space-document-crud-baseline` 已经把空间、文档元数据和 summary 写入闭环打通，但文档页仍停留在元数据详情层。
  - 如果继续只在元数据层迭代，M2 的“打开真实文档页并进行单人编辑”目标就会被悬空，后续协同、AI、快照与索引也会失去正文基线。
- **范围内**：
  - 在 `apps/web` 文档页接入 `BlockNote` 单人编辑器。
  - 建立 `packages/editor` 的最小共享封装入口。
  - 为文档正文提供最小读取 / 保存承接位，并通过当前 API 边界持久化到 PostgreSQL。
  - 让单人正文编辑可加载、可修改、可保存、可刷新重载。
- **范围外**：
  - 不接入 `Yjs`、`Hocuspocus`、协同 token、presence 或多浏览器同步。
  - 不接入 `@blocknote/xl-ai`、`@blocknote/xl-ai/server` 或任何 AI 动作。
  - 不落地稳定快照、索引任务、导出、Citation 或复杂版本管理。
  - 不做正式权限体系或正文协同态设计。

## Approved Behavior

- **已批准需求摘要**：
  - `apps/web` 文档页必须从元数据详情页升级为真实编辑器页面。
  - 编辑器必须基于 `BlockNote`，而不是临时 `textarea` 或自定义伪编辑器。
  - 文档正文在页面加载时必须能被读取到编辑器中。
  - 文档正文在用户编辑后必须能通过现有 API 边界保存，并在刷新后重新加载出来。
  - `packages/editor` 必须提供可复用的最小编辑器入口，供 `apps/web` 统一消费。
- **关键场景**：
  - 用户打开一个文档路由时，看到的是可交互的 BlockNote 编辑器，而不是元数据占位内容。
  - 编辑器加载后会展示当前文档的已保存正文内容。
  - 用户编辑正文并触发保存后，刷新页面仍能看到保存结果。
- **验收检查**：
  - `apps/web` 类型检查通过，构建通过。
  - `apps/api` 类型检查通过，正文读写接口可用。
  - 手动验证可证明正文内容在页面刷新后仍能重载。

## Design Constraints

- **架构约束**：
  - 必须继续复用现有 `React SPA + AdonisJS + PostgreSQL` 基线，不引入第二套正文存储路径。
  - 当前 change 只实现单人编辑，不把协同态、快照态或索引态混进正文编辑实现。
  - `BlockNote` 集成优先贴近官方推荐方式，避免自造编辑协议层。
- **接口约束**：
  - 文档正文读写可以扩展现有文档接口，或新增最小正文专用接口，但都必须保持当前 API 边界清晰。
  - `packages/editor` 需要暴露一个稳定的前端入口，让 `apps/web` 不直接散落 BlockNote 组装逻辑。
- **依赖约束**：
  - `apps/web` 需要新增 `BlockNote` 前端依赖。
  - 当前不引入协同、AI、队列或检索相关依赖。
- **数据约束**：
  - 文档正文只要求当前阶段的最小持久化承接位。
  - 当前正文保存只服务单人编辑闭环，不承诺后续协同版本语义。

## Task Batches

### Batch 1

- **目标**：建立正文持久化承接位。
- **输入**：当前 `apps/api` 的文档元数据接口、`single-user-document-editor-baseline` spec、现有 PostgreSQL 模型。
- **输出**：文档正文读取与保存的最小 API / service 边界。
- **完成标准**：
  - `apps/api` 类型检查通过。
  - 文档正文可被读写。
  - 保存结果可重新读取。

### Batch 2

- **目标**：接入 BlockNote 单人编辑器。
- **输入**：Batch 1 的正文读写边界、`blocknote-web-integration-baseline` spec、当前 `apps/web` 文档页。
- **输出**：`packages/editor` 最小入口、文档页 BlockNote 渲染、load/save wiring。
- **完成标准**：
  - `apps/web` 类型检查通过。
  - `apps/web` 构建通过。
  - 文档页显示真实编辑器而不是元数据占位。

### Batch 3

- **目标**：验证单人编辑闭环。
- **输入**：前两批产物、本地 PostgreSQL 数据库。
- **输出**：正文编辑后可保存、刷新、重载的真实闭环。
- **完成标准**：
  - 页面编辑正文后刷新仍能保留修改。
  - 真实页面验证通过。
  - 工作区检查不再暴露单人正文编辑缺口。

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 当前文档页若仍只是元数据详情，应视为正文编辑未落地。
  - 当前前端若没有真实 BlockNote 编辑器，应视为该 change 的 UI 目标未落地。
  - 当前正文修改若刷新后丢失，应视为持久化承接位未完成。
- **必需的边界情况**：
  - 不能把协同、AI、快照或索引提前混进这条 change。
  - 不能把临时编辑器 fallback 误当成 BlockNote 正式集成。
  - 不能让正文保存逻辑脱离当前文档 API 边界另起炉灶。
- **回归敏感区域**：
  - `apps/web/src/router.tsx`
  - `apps/web/package.json`
  - `packages/editor/`
  - `apps/api/start/routes.ts`
  - `apps/api/app/controllers/documents_controller.ts`
  - `apps/api/app/services/docweave_catalog_service.ts`

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这条 change 适合按“API 承接位 -> 编辑器接入 -> 闭环验证”三批顺序推进。
  - 每批都能用明确的类型检查和真实刷新验证收口，没必要上更重的流程。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 待确认单人正文编辑加载、保存、刷新重载是否都已落地 |
| Correctness | Pending | 待确认 BlockNote 集成方式与正文 API 边界是否对齐当前阶段 |
| Coherence | Pending | 待确认 web、api、packages/editor 三者对正文流的责任边界一致 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 后审查正文承接位是否过度设计。
  - Batch 2 后审查 BlockNote 是否是正式编辑器，而非临时替代品。
  - Batch 3 后审查正文刷新重载是否真实成立。
- **阻塞类别**：
  - 实现试图把协同、AI、快照或索引提前纳入当前 change。
  - 文档页无法通过编辑器读写正文内容。
  - 页面保存成功但刷新后正文丢失。

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果需要把协同、AI、快照或版本管理纳入正文编辑闭环。
  - 如果正文存储边界必须引入新的模型或独立服务，且已超出当前 proposal 覆盖。
- **何时回退到 `bridging`**：
  - 如果 proposal/specs/design/tasks 更新，导致当前合同不再准确反映正文编辑边界。
- **何时不得继续实现**：
  - 用户未明确批准本执行合同。
  - 实现试图超出单人编辑、正文读写和 `packages/editor` 最小封装的范围。
