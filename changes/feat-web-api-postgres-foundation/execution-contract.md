# 执行合同

## Intent Lock

- **变更名称**：`feat-web-api-postgres-foundation`
- **要解决的问题**：
  - `DocWeave` 已经实际落地了 `apps/web`、`apps/api` 和 PostgreSQL 元数据基线的第一批实现，但这些实现此前没有被独立的 `spec-superflow` change 承接。
  - 如果继续在未映射的实现状态上迭代，后续关于范围、验收、测试和回归的判断会越来越失真。
- **范围内**：
  - 规范化 `apps/web` 的 `TanStack Router + TanStack Query` 工作台骨架。
  - 规范化 `apps/api` 的 phase-1 元数据与占位能力路由边界。
  - 规范化 PostgreSQL 连接、`spaces/documents` 模型、迁移与 baseline seed。
  - 规范化本地 API 代理和 `DB_* / REDIS_* / QDRANT_*` 环境变量模板。
- **范围外**：
  - 不实现完整登录、正式权限体系、BlockNote 编辑器、协同房间、worker 执行链、真实 RAG 或流式 AI 输出。
  - 不把 Redis、Qdrant、MinIO 从配置占位扩展为真实业务客户端。

## Approved Behavior

- **已批准需求摘要**：
  - `apps/web` 必须提供 overview、space、document 三类可导航页面骨架。
  - `apps/web` 必须通过真实 API 读取元数据，而不是继续依赖本地假数据。
  - `apps/api` 必须明确暴露 `auth / spaces / documents / collaboration / ai / rag` 路由边界。
  - PostgreSQL 必须成为当前元数据基线，并具备 `spaces`、`documents` 及本地 seed 数据。
- **关键场景**：
  - 开发者启动 `apps/web` 后，看到的是工作台骨架而不是默认 Vite demo。
  - 开发者访问 `/api/spaces`、`/api/documents`、`/api/documents/:documentId` 时，可以得到结构化元数据响应。
  - 开发者运行迁移和 seed 后，本地 PostgreSQL 中存在可支撑当前页面显示的基础数据。
  - 开发者从前端概览页可以导航到某个 space，再导航到某篇 document。
- **验收检查**：
  - `web` 路由与 Query 骨架存在且构建通过。
  - `api` 路由边界与 controller 模块存在且类型检查通过。
  - PostgreSQL 迁移与 seed 可执行，`spaces/documents` 数据可查询。
  - 本地工作区检查可证明 `web/api/postgres` 链路已经打通。

## Design Constraints

- **架构约束**：
  - 必须保持 `apps/web` 与 `apps/api` 独立，不回退到一体化 starter 结构。
  - 只把 `spaces/documents` 接到真实 PostgreSQL 数据层，其余 `auth/collaboration/ai/rag` 保持占位边界即可。
  - 不提前把当前 change 扩展为 BlockNote、协同、worker 或 RAG 真正执行闭环。
- **接口约束**：
  - `apps/web` 只消费 `/api/spaces`、`/api/documents`、`/api/documents/:documentId` 这组元数据接口作为当前真实数据入口。
  - `apps/api` 必须保留 phase-1 规划中的能力域路径命名，不在当前 change 中随意改写成其他分组。
- **依赖约束**：
  - 当前数据库驱动锁定为 PostgreSQL `pg`。
  - Redis/Qdrant 只允许停留在环境变量模板与本地配置占位层。
- **数据约束**：
  - 当前只需要 `spaces` 与 `documents` 两类基础元数据。
  - baseline seed 只服务本地联调，不代表正式业务初始化策略。

## Task Batches

### Batch 1

- **目标**：规范化 `apps/web` 的路由与 Query 骨架。
- **输入**：`web-workspace-shell` spec、当前 `apps/web` 实现、既有路线图中的 M2 元数据页面目标。
- **输出**：overview/space/document 路由、Query 数据读取层、本地 `/api` 代理。
- **完成标准**：
  - 默认 Vite demo 已被替换。
  - `apps/web` 可通过 `typecheck` 与 `build`。
  - 前端数据入口不再依赖本地假数据。

### Batch 2

- **目标**：规范化 `apps/api` 的 phase-1 路由与模块边界。
- **输入**：`api-metadata-route-baseline` spec、当前 `apps/api` 实现、第一阶段规划中的 API 集合。
- **输出**：`auth / spaces / documents / collaboration / ai / rag` 路由骨架与对应 controller 模块。
- **完成标准**：
  - `spaces/documents` 真实接口存在。
  - `collaboration/ai/rag` 占位入口存在。
  - `apps/api` 可通过 `typecheck`。

### Batch 3

- **目标**：规范化 PostgreSQL 元数据基线。
- **输入**：`postgres-metadata-baseline` spec、当前数据库配置与模型实现。
- **输出**：PostgreSQL 连接配置、`spaces/documents` 模型、迁移与 baseline seeder。
- **完成标准**：
  - `migration:run` 成功。
  - `db:seed` 成功。
  - `migration:status` 显示元数据迁移已完成。

### Batch 4

- **目标**：确认前后端元数据链路已联通。
- **输入**：前三批产物、本地 PostgreSQL seed 数据、当前工作区脚本。
- **输出**：可被前端真实消费的 space/document 数据链路。
- **完成标准**：
  - `pnpm check:workspace` 通过。
  - `pnpm build:web` 通过。
  - `spaces` 与 `documents` 可通过 SQL 查询验证。

## Test Obligations

- **必须先从失败测试开始的行为**：
  - `apps/web` 仍为默认 demo 时，应视为 web 路由骨架未落地。
  - `apps/api` 仍停留在 starter 默认路由时，应视为 phase-1 元数据边界未建立。
  - PostgreSQL 迁移或 seed 不存在时，应视为元数据基线未落地。
  - 前端若仍依赖本地假数据，应视为前后端链路未联通。
- **必需的边界情况**：
  - 不能把 Redis/Qdrant 的占位配置误做成当前 change 的真实业务依赖。
  - 不能把当前占位 `auth/collaboration/ai/rag` 误包装成已完成功能。
  - 不能让 `web` 数据层继续退回本地假数据。
- **回归敏感区域**：
  - `apps/web/src/router.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/api/start/routes.ts`
  - `apps/api/config/database.ts`
  - `apps/api/database/migrations/`
  - `apps/api/database/seeders/`

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 这条 change 主要是把已经落地的实现正式映射回流程工件，分批验证最合适。
  - 每一批都可以围绕明确的输入、输出和验证命令收口，不需要额外 SDD 多代理循环。

## Verification Dimensions

| 维度 | 状态 | 发现 |
|------|------|------|
| Completeness | Pending | 待确认 web/api/postgres 三块实现是否都被工件完整覆盖 |
| Correctness | Pending | 待确认当前实现与规划中的 phase-1 边界和数据库选择完全一致 |
| Coherence | Pending | 待确认前端路由、API 路径、数据库 seed 与环境变量模板彼此一致 |

**总体结论**：Pending

## Review Gates

- **强制审查点**：
  - Batch 1 后审查 `apps/web` 是否真正摆脱默认 demo。
  - Batch 2 后审查 `apps/api` 是否建立了正确的能力域边界。
  - Batch 3 后审查 PostgreSQL 是否真正取代 SQLite 成为当前元数据基线。
  - Batch 4 后审查前后端是否使用同一批真实 seed 数据完成链路联通。
- **阻塞类别**：
  - 当前实现超出 foundation 范围，扩展到 BlockNote、协同、worker 或真实 RAG。
  - PostgreSQL 配置、迁移、seed 中任一项失效。
  - 前端仍无法通过真实 API 与本地数据库数据联调。

## Escalation Rules

- **何时回退到 `specifying`**：
  - 如果要把创建/编辑写接口、真实表单流或正式认证一并纳入这条 change。
  - 如果要把 Redis/Qdrant 从配置占位扩展成真实业务调用。
- **何时回退到 `bridging`**：
  - 如果 proposal/specs/design/tasks 任一工件更新，导致当前合同不再准确反映已落地实现。
  - 如果需要把当前 foundation change 重命名或重新压缩边界。
- **何时不得继续实现**：
  - 用户未明确批准本执行合同。
  - 当前 change 试图继续吸收“可交互闭环”的写接口与表单流程。
  - 实现与当前 phase-1 文档边界发生冲突。
