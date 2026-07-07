# Codex Local Files

`.codex/` 用于存放本地 Codex 辅助配置、缓存或线程相关文件。

- 它不属于 DocWeave 业务 Monorepo 的应用、共享包或基础设施边界
- 项目级 skills 按当前 Codex 官方约定统一放在 `.agents/skills/`
- `.codex/` 继续保留给 `config.toml`、README 和其他本地 Codex 辅助文件
- 后续业务开发应继续围绕 `apps/`、`packages/` 与 `infrastructure/` 展开

当前项目级 subagents 放在 `.codex/agents/`，按职责拆分为：

- `docweave-explorer`：代码摸底与调用链探索
- `docweave-docs-researcher`：官方文档与接入范式研究
- `docweave-reviewer`：行为回归与风险审查
- `docweave-ui-planner`：页面清单与页面规格规划
- `docweave-ui-reviewer`：页面体验与设计基线评审
- `docweave-frontend-architect`：前端路由、目录和页面实现架构守门

配套 prompt 模板：

- `docweave-frontend-architect.prompt.md`：前端实现架构评审模板
- `docweave-frontend-refactor-execution.prompt.md`：前端路由拆分与页面改造执行模板
