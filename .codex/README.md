# Codex Local Files

`.codex/` 用于存放本地 Codex 辅助配置、缓存或线程相关文件。

- 它不属于 DocWeave 业务 Monorepo 的应用、共享包或基础设施边界
- 项目级 skills 按当前 Codex 官方约定统一放在 `.agents/skills/`
- `.codex/` 继续保留给 `config.toml`、README 和其他本地 Codex 辅助文件
- 后续业务开发应继续围绕 `apps/`、`packages/` 与 `infrastructure/` 展开
