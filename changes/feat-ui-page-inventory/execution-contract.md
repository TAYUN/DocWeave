# 执行合同

## Intent Lock

- **变更名称**：`feat-ui-page-inventory`
- **要解决的问题**：
  - DocWeave 当前缺少统一的页面清单、页面规格和布局基线，导致 AI 在实现 UI 时依赖猜测，产出不稳定。
- **范围内**：
  - `docs/ui/page-inventory.md`
  - `docs/ui/pages/` 下的页面规格文档
  - 布局框架、跨页面状态规则、页面边界与阶段边界
  - 让 `docweave-ui-planner` / `docweave-ui-reviewer` 有可复用的上游依据
- **范围外**：
  - 任何前端页面代码实现
  - 新增后端 API
  - 新增真实 AI / RAG / 设置能力
  - 进入页面 build 阶段的实现批次

## Approved Behavior

- **已批准需求摘要**：
  - 项目需要一份完整页面清单，说明有哪些页面、当前状态和阶段归属。
  - 当前已实现页面（P01-P04）必须有可执行的文本级页面规格。
  - 规划页面至少要有占位规格，避免后续 AI 从零自由发挥。
  - 页面规格必须显式区分 `disabled` 与 `restricted / 无权限`，并说明回退路径。
  - `/ai`、`/chat`、`/documents/:documentId` 的边界必须明确，避免职责重叠。
- **关键场景**：
  - 实现者需要快速判断某个页面是否已定义、该怎么设计、有哪些状态。
  - UI 评审 agent 需要基于同一套页面模板检查实现。
  - 后续页面实现 change 需要引用这批规格，而不是重新发明页面结构。
- **验收检查**：
  - `docs/ui/page-inventory.md` 可作为页面导航索引使用。
  - `docs/ui/pages/` 覆盖 P01-P09 当前已定义范围。
  - 页面规格、design、specs 之间不再存在编号、状态规则、路由参数命名上的明显冲突。

## Design Constraints

- **设计约束**：
  - 以 `DESIGN.md` 为视觉基线，不把页面规格写成品牌展示页提案。
  - 以 `frontend-mantine-implementation-guide.md` 为实现边界，保持 Mantine 默认工作台口径。
- **结构约束**：
  - 页面规格优先定义主任务、信息分区、状态矩阵和导航关系。
  - 占位页面也必须写清阶段边界，不能伪装成已可实现能力。
- **命名约束**：
  - 使用当前真实路由参数命名，例如 `/documents/:documentId`。
  - 页面编号必须在 `proposal.md`、`design.md`、`page-inventory.md`、页面规格之间保持一致。

## Task Batches

### Batch 1

- **目标**：产出页面清单、布局框架和页面规格基线
- **输入**：
  - `proposal.md`
  - `design.md`
  - `specs/`
- **输出**：
  - `docs/ui/page-inventory.md`
  - `docs/ui/pages/p01` 到 `p09`
- **完成标准**：
  - 当前已实现页面有完整规格，规划页面至少有占位规格，且可以被后续实现引用

### Batch 2

- **目标**：按 UI review 收口页面编号、状态规则、布局边界和页面职责冲突
- **输入**：
  - Batch 1 文档产物
  - `docweave-ui-reviewer` 评审结论
- **输出**：
  - 修正后的 `proposal.md`、`design.md`、`specs/`、`docs/ui/pages/`
- **完成标准**：
  - `disabled` / `restricted` 分离、`P08/P09` 一致、`documentId` 命名一致、`P09` 页面规格补齐

## Test Obligations

- **必须验证的内容**：
  - `tasks.md` 无未勾选项
  - `specs/` 通过 `ssf` 状态机基本 guard，不再因 schema 缺口阻塞
  - `proposal.md`、`design.md`、`specs/`、`docs/ui/` 之间的页面编号和状态规则一致
- **回归敏感区域**：
  - 页面编号与路由参数命名
  - `disabled` / `restricted / 无权限` 的一致表达
  - `/ai`、`/chat`、`/documents/:documentId` 的页面职责边界

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这次 change 是文档基线收口，不涉及代码实现，但仍需要分批完成页面清单、页面规格和 UI review 修正，适合轻量批次收口。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pass | 页面清单、P01-P09 页面规格与 UI 评审修正已补齐 |
| Correctness | Pass | 编号、路由参数、状态规则与阶段边界已同步修正 |
| Coherence | Pass | 规格、设计、任务与页面文档已能互相引用，不再明显冲突 |

**总体结论**：Pass

## Review Gates

- **强制审查点**：
  - 页面总览与页面规格是否一致
  - 设计层与 spec 层的状态结构是否一致
  - 占位页是否写清楚“未启用/后续阶段”边界
- **阻塞类别**：
  - 页面编号冲突
  - 页面职责重叠
  - `disabled` / `restricted` 混写
  - 页面规格缺失导致后续实现仍需靠猜

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果需要新增大量页面，或页面职责边界发生根本变化
- **何时回退到 `bridging`**：
  - 如果需要重写页面模板结构、布局骨架或状态矩阵定义
- **何时不得继续推进为实现**：
  - 如果没有明确引用本 change 的页面规格
  - 如果后续实现试图绕过 `docs/ui/pages/` 重新定义页面结构
