# 执行合同

## Intent Lock

- **变更名称**：`chore-monorepo-bootstrap`
- **要解决的问题**：
  - `DocWeave` 已完成阶段性技术决策与架构规划，但仓库还没有真实可执行的 Monorepo 工程外壳。
  - 如果后续功能开发直接从某个应用或包开始实现，会在目录结构、共享配置、运行时边界和本地基础设施入口上重复做全局决策，增加返工风险。
- **范围内**：
  - 建立 Monorepo 根工作区壳。
  - 建立 `apps/web`、`apps/api`、`apps/collab`、`apps/worker` 目录基线。
  - 建立 `packages/shared`、`auth`、`database`、`editor`、`ai`、`rag`、`collaboration`、`ui`、`config` 目录基线。
  - 建立 `infrastructure/postgres`、`redis`、`qdrant`、`minio` 本地开发入口基线。
  - 建立根级包管理、TypeScript 基线、根说明文档和工程约束说明。
- **范围外**：
  - 不实现业务页面、业务 API、协同协议细节、RAG 处理链或生产级部署编排。
  - 不引入 `BullMQ`、`assistant-ui`、复杂导出体系、多 Agent 产品能力或额外未批准运行时。

## Approved Behavior

- **已批准需求摘要**：
  - 根目录必须提供 Monorepo 工作区所需的最小根壳文件。
  - `apps/` 必须包含四个已批准的 phase-1 运行时目录，并保留各自职责边界。
  - `packages/` 必须包含九个已批准的共享能力目录，并维持既有边界拆分。
  - `infrastructure/` 必须包含四个本地开发入口目录，但不承诺完整生产编排。
  - 工作区必须具备共享工具基线，使后续 app/package 能在不重构根结构的前提下增量初始化。
- **关键场景**：
  - 开发者查看仓库根目录时，能看到统一的工作区配置入口。
  - 开发者查看 `apps/` 和 `packages/` 时，能直接识别已批准的 phase-1 边界集合。
  - 开发者查看 `infrastructure/` 时，能明确它服务本地开发入口，而不是完整生产部署。
  - 后续初始化任一 app/package 时，可以继承根工作区约定，而不需要重新定义同类基础配置。
- **验收检查**：
  - 根级文件存在且表达 Monorepo 工作区基线。
  - 所有批准的 app/package/infrastructure 目录存在。
  - README 与说明文件能准确表达工程边界与非目标。
  - 未出现未批准的额外运行时目录或依赖前置承诺。

## Design Constraints

- **架构约束**：
  - 必须保持 `web / api / collab / worker` 四运行时分离。
  - 必须保持 `ai` 与 `rag` 的职责分离，不把检索与模型接入混成一个共享包。
  - 本次实现只落地工程外壳，不落地业务闭环或部署系统。
- **接口约束**：
  - 根工作区配置必须能作为后续 app/package 继承入口。
  - 根 README 与 `infrastructure/README.md` 必须清晰表达边界，避免被误读为完成态业务接口或部署接口。
- **依赖约束**：
  - 不把 `BullMQ`、`assistant-ui` 或其他第二阶段能力写成当前初始化的必需依赖。
  - 包管理与 TypeScript 基线应保持最小必要集，避免过早加重根配置。
- **数据约束**：
  - 本次变更不引入业务数据模型、文档快照结构、协同态结构或索引态结构。
  - `infrastructure/` 只表达本地依赖入口，不承诺生产数据部署方案。

## Task Batches

### Batch 1

- **目标**：建立根工作区配置基线。
- **输入**：已批准的 proposal、`monorepo-workspace-shell` 与 `workspace-tooling-baseline` specs、设计中的“根壳优先”决策。
- **输出**：根 `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`、`.gitignore`、根 `README.md` 初版。
- **完成标准**：
  - 根级工作区文件全部创建完成。
  - 可通过文件存在性检查确认基线落地。
  - 根配置内容没有越权引入第二阶段依赖。

### Batch 2

- **目标**：建立 phase-1 apps 与 packages 目录边界。
- **输入**：Batch 1 的工作区配置、`multi-app-directory-baseline` 与 `shared-package-boundary-baseline` specs。
- **输出**：四个 `apps/*` 目录与九个 `packages/*` 目录的基线占位结构。
- **完成标准**：
  - 批准的 app/package 目录全部存在。
  - 未添加未批准目录。
  - 目录集合与规划文档一致。

### Batch 3

- **目标**：建立本地基础设施入口基线。
- **输入**：Batch 2 的目录结构、`infrastructure-local-baseline` spec、设计中的“只做本地入口”决策。
- **输出**：`infrastructure/postgres`、`redis`、`qdrant`、`minio` 目录及 `infrastructure/README.md`。
- **完成标准**：
  - 四个基础设施入口目录存在。
  - 说明文档明确“仅本地开发入口，不代表完整生产编排”。
  - 没有额外未批准服务目录。

### Batch 4

- **目标**：补齐根说明文档与本地辅助目录约束说明。
- **输入**：前三批产物、根 README 初版、设计中的风险与边界说明。
- **输出**：补全后的根 `README.md` 与 `.codex/README.md`。
- **完成标准**：
  - README 明确顶层结构、phase-1 边界与基础设施范围。
  - `.codex/README.md` 明确该目录不属于业务 Monorepo 基线。
  - 后续开发者可以根据文档直接继续初始化子项目。

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 根工作区关键文件不存在时，存在性检查必须失败。
  - phase-1 app/package 目录不存在时，目录检查必须失败。
  - 基础设施入口缺失时，基础设施检查必须失败。
  - 根说明文档缺少关键边界说明时，README 断言检查必须失败。
- **必需的边界情况**：
  - 不能遗漏任何已批准的 phase-1 app 或 package 目录。
  - 不能把 `infrastructure/` 误写成生产级编排承诺。
  - 不能在根配置中偷偷加入未批准的第二阶段运行时依赖。
- **回归敏感区域**：
  - 根 `package.json`、`pnpm-workspace.yaml`、`tsconfig.base.json`
  - `apps/` 与 `packages/` 的目录集合
  - `infrastructure/README.md` 与根 `README.md` 的边界措辞

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 本次变更是多文件工程初始化，适合按批次顺序执行并在每批后做验证。
  - 复杂度不足以需要完整 `SDD` 多子代理循环，但明显超过单次 `Inline` 修改。
  - 每个 batch 都有清晰输入、输出和完成标准，适合批次内联推进。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 待执行后确认根文件、目录集合、说明文档是否全部落地 |
| Correctness | Pending | 待执行后确认根配置、目录边界和约束措辞与规划文档一致 |
| Coherence | Pending | 待执行后确认 README、infrastructure 入口和 `.codex` 约束说明彼此不冲突 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 完成后审查根工作区配置是否越界。
  - Batch 2 完成后审查 app/package 边界是否与规划一致。
  - Batch 3 完成后审查基础设施入口是否被误写成生产编排。
  - Batch 4 完成后审查 README 与约束说明是否足够清晰。
- **阻塞类别**：
  - 缺失任何已批准的 app/package/infrastructure 目录。
  - 根配置引入未批准的运行时依赖或扩展范围。
  - 说明文档与 proposal/specs/design 中的范围外条目矛盾。

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果需要新增未在 proposal/specs 中批准的目录、运行时或共享包边界。
  - 如果后续实现发现 `packages/document` 等能力必须纳入本次变更范围，且当前 proposal 未覆盖。
- **何时回退到 `bridging`**：
  - 如果 proposal/specs/design/tasks 任一工件更新，导致当前批次、边界或测试义务不再匹配。
  - 如果 README 或根配置的表述无法再准确反映已批准需求，需要重新压缩执行合同。
- **何时不得继续实现**：
  - 用户未明确批准本执行合同。
  - 根工作区基线尚未确认，但实现中试图继续初始化业务代码、业务接口或第二阶段依赖。
  - 执行中出现未映射需求、未批准范围扩展或与当前设计决策冲突的结构变更。
