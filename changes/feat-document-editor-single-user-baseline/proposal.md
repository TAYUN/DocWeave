# 变更提案

## 背景（Why）

`feat-space-document-crud-baseline` 已经打通了 `space/document` 的元数据读写闭环，用户现在可以创建空间、创建文档并编辑文档摘要，项目也因此拥有了第一条真实可交互链路。

但当前文档页仍然只停留在元数据详情层，尚未接入真正的正文编辑能力。按照既有路线图，M2 的下一步应该是让用户“打开真实文档页并进行单人编辑”，而不是继续在元数据层反复打转。

现在需要新增一条 change，把文档页推进到 `BlockNote` 单人编辑基线：前端真正渲染编辑器，后端提供最小正文读写承接位，形成“空间/文档元数据 + 单人正文编辑”的下一阶段闭环。

## 变更内容（What Changes）

- 在 `apps/web` 的文档页接入 `BlockNote` 单人编辑器。
- 在共享层建立最小 `packages/editor` 封装入口。
- 为 `apps/api` 补正文内容读取/保存所需的最小接口或持久化承接位。
- 让文档页在不依赖协同与 AI 的前提下支持单人编辑。

## 能力（Capabilities）

### 新增能力

- single-user-document-editor-baseline
- blocknote-web-integration-baseline
- document-content-save-baseline

### 修改能力

- web-workspace-shell
- api-metadata-route-baseline

## 范围（Scope）

### 范围内（In Scope）

- `apps/web` 文档页接入 `BlockNote`
- 单人编辑态下的文档内容加载与保存
- `packages/editor` 的最小封装入口
- 与正文内容相关的最小 API 承接接口

### 范围外（Out of Scope）

- 不接入 `Yjs`、`Hocuspocus`、协同 token 或多浏览器同步
- 不接入 `@blocknote/xl-ai`、`@blocknote/xl-ai/server` 或任何 AI 动作
- 不落地稳定快照、索引任务、导出或 Citation
- 不做正式权限体系或复杂正文版本管理

## 影响（Impact）

- 影响的代码区域：`apps/web`、`apps/api`、`packages/editor`
- 影响的 API 或接口：新增或调整文档正文读写接口
- 依赖或涉及的外部系统：BlockNote 前端包、本地 PostgreSQL
