# 实现任务

## 文件结构

- `Create: package.json` — 定义根工作区包清单、共享脚本入口与包管理器约定
- `Create: pnpm-workspace.yaml` — 注册 `apps/*` 与 `packages/*` 工作区范围
- `Create: tsconfig.base.json` — 提供工作区共享 TypeScript 基线
- `Create: .gitignore` — 统一忽略依赖、构建产物与本地环境文件
- `Create: README.md` — 说明 Monorepo 根壳用途、目录结构与启动顺序
- `Create: apps/web/.gitkeep` — 预留前端应用目录
- `Create: apps/api/.gitkeep` — 预留主业务 API 目录
- `Create: apps/collab/.gitkeep` — 预留协同服务目录
- `Create: apps/worker/.gitkeep` — 预留后台 worker 目录
- `Create: packages/shared/.gitkeep` — 预留共享通用能力目录
- `Create: packages/auth/.gitkeep` — 预留认证能力目录
- `Create: packages/database/.gitkeep` — 预留数据库能力目录
- `Create: packages/editor/.gitkeep` — 预留编辑器封装目录
- `Create: packages/ai/.gitkeep` — 预留模型接入能力目录
- `Create: packages/rag/.gitkeep` — 预留检索与上下文构建目录
- `Create: packages/collaboration/.gitkeep` — 预留协同协议目录
- `Create: packages/ui/.gitkeep` — 预留 UI 共享能力目录
- `Create: packages/config/.gitkeep` — 预留共享配置目录
- `Create: infrastructure/postgres/.gitkeep` — 预留 PostgreSQL 本地开发入口目录
- `Create: infrastructure/redis/.gitkeep` — 预留 Redis 本地开发入口目录
- `Create: infrastructure/qdrant/.gitkeep` — 预留 Qdrant 本地开发入口目录
- `Create: infrastructure/minio/.gitkeep` — 预留 MinIO 本地开发入口目录
- `Create: infrastructure/README.md` — 说明本地基础设施入口的职责与边界
- `Create: .codex/README.md` — 说明该目录只用于本地 Codex 辅助文件，不属于业务 Monorepo 基线

## 接口

### Batch 1 → Batch 2
- **Produces**: `workspace package manifest` — 被 Batch 2 用于挂接 `apps/*` 与 `packages/*` 目录
- **Produces**: `pnpm workspace registration` — 被 Batch 2 用于验证工作区目录是否处于受管状态
- **Produces**: `shared tsconfig baseline` — 被 Batch 2 用于后续 app/package 初始化继承

### Batch 2 → Batch 3
- **Produces**: `phase-1 app directory baseline` — 被 Batch 3 用于补充本地基础设施与文档说明
- **Produces**: `phase-1 package directory baseline` — 被 Batch 3 用于验证共享边界集合完整性

### Batch 3 → Batch 4
- **Produces**: `local infrastructure entry baseline` — 被 Batch 4 用于最终验证 README 与工程约束说明
- **Produces**: `root onboarding docs` — 被 Batch 4 用于确认后续开发者可以按统一入口继续推进

## 1. Batch 1: 建立根工作区配置基线

- [x] **1.1 编写失败的测试**

```text
检查以下文件当前不存在：
- package.json
- pnpm-workspace.yaml
- tsconfig.base.json
- .gitignore
- README.md
```

**Files**: `Modify: package.json`, `Create: pnpm-workspace.yaml`, `Create: tsconfig.base.json`, `Create: .gitignore`, `Create: README.md`

- [x] **1.2 运行测试并确认失败**

Run: `powershell -NoProfile -Command "Test-Path package.json; Test-Path pnpm-workspace.yaml; Test-Path tsconfig.base.json; Test-Path .gitignore; Test-Path README.md"`
Expected: FAIL with at least one `False` for each required root baseline file

- [x] **1.3 实现最小化代码**

```json
{
  "name": "docweave",
  "private": true,
  "packageManager": "pnpm@10",
  "scripts": {
    "dev:web": "pnpm --dir apps/web dev",
    "dev:api": "pnpm --dir apps/api dev",
    "dev:collab": "pnpm --dir apps/collab dev",
    "dev:worker": "pnpm --dir apps/worker dev"
  }
}
```

```yaml
packages:
  - apps/*
  - packages/*
```

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true
  }
}
```

**Files**: `Create: package.json`, `Create: pnpm-workspace.yaml`, `Create: tsconfig.base.json`, `Create: .gitignore`, `Create: README.md`
**Interfaces**: Produces `workspace package manifest` — 提供统一工作区入口；Produces `pnpm workspace registration` — 为后续目录纳管提供基础；Produces `shared tsconfig baseline` — 为后续子项目继承提供统一 TypeScript 基线

- [x] **1.4 运行测试并确认通过**

Run: `powershell -NoProfile -Command "Test-Path package.json; Test-Path pnpm-workspace.yaml; Test-Path tsconfig.base.json; Test-Path .gitignore; Test-Path README.md"`
Expected: PASS with all required root baseline files returning `True`

- [x] **1.5 提交**

```bash
git add package.json pnpm-workspace.yaml tsconfig.base.json .gitignore README.md
git commit -m "feat: 初始化根工作区配置基线"
```

## 2. Batch 2: 建立 phase-1 apps 与 packages 目录边界

- [x] **2.1 编写失败的测试**

```text
检查以下目录当前不存在：
- apps/web
- apps/api
- apps/collab
- apps/worker
- packages/shared
- packages/auth
- packages/database
- packages/editor
- packages/ai
- packages/rag
- packages/collaboration
- packages/ui
- packages/config
```

**Files**: `Create: apps/web/.gitkeep`, `Create: apps/api/.gitkeep`, `Create: apps/collab/.gitkeep`, `Create: apps/worker/.gitkeep`, `Create: packages/shared/.gitkeep`, `Create: packages/auth/.gitkeep`, `Create: packages/database/.gitkeep`, `Create: packages/editor/.gitkeep`, `Create: packages/ai/.gitkeep`, `Create: packages/rag/.gitkeep`, `Create: packages/collaboration/.gitkeep`, `Create: packages/ui/.gitkeep`, `Create: packages/config/.gitkeep`

- [x] **2.2 运行测试并确认失败**

Run: `powershell -NoProfile -Command "$paths = 'apps/web','apps/api','apps/collab','apps/worker','packages/shared','packages/auth','packages/database','packages/editor','packages/ai','packages/rag','packages/collaboration','packages/ui','packages/config'; $paths | ForEach-Object { '{0}:{1}' -f $_, (Test-Path $_) }"`
Expected: FAIL with missing directories reported as `False`

- [x] **2.3 实现最小化代码**

```text
创建目录并在每个目录下放置 .gitkeep：
- apps/web/.gitkeep
- apps/api/.gitkeep
- apps/collab/.gitkeep
- apps/worker/.gitkeep
- packages/shared/.gitkeep
- packages/auth/.gitkeep
- packages/database/.gitkeep
- packages/editor/.gitkeep
- packages/ai/.gitkeep
- packages/rag/.gitkeep
- packages/collaboration/.gitkeep
- packages/ui/.gitkeep
- packages/config/.gitkeep
```

**Files**: `Create: apps/web/.gitkeep`, `Create: apps/api/.gitkeep`, `Create: apps/collab/.gitkeep`, `Create: apps/worker/.gitkeep`, `Create: packages/shared/.gitkeep`, `Create: packages/auth/.gitkeep`, `Create: packages/database/.gitkeep`, `Create: packages/editor/.gitkeep`, `Create: packages/ai/.gitkeep`, `Create: packages/rag/.gitkeep`, `Create: packages/collaboration/.gitkeep`, `Create: packages/ui/.gitkeep`, `Create: packages/config/.gitkeep`
**Interfaces**: Produces `phase-1 app directory baseline` — 为后续各运行时初始化提供稳定路径；Produces `phase-1 package directory baseline` — 为共享边界与依赖归属提供稳定路径

- [x] **2.4 运行测试并确认通过**

Run: `powershell -NoProfile -Command "$paths = 'apps/web','apps/api','apps/collab','apps/worker','packages/shared','packages/auth','packages/database','packages/editor','packages/ai','packages/rag','packages/collaboration','packages/ui','packages/config'; $paths | ForEach-Object { '{0}:{1}' -f $_, (Test-Path $_) }"`
Expected: PASS with every required directory reported as `True`

- [x] **2.5 提交**

```bash
git add apps packages
git commit -m "feat: 初始化 phase-1 应用与共享包目录"
```

## 3. Batch 3: 建立本地基础设施入口基线

- [x] **3.1 编写失败的测试**

```text
检查以下目录与说明文件当前不存在：
- infrastructure/postgres
- infrastructure/redis
- infrastructure/qdrant
- infrastructure/minio
- infrastructure/README.md
```

**Files**: `Create: infrastructure/postgres/.gitkeep`, `Create: infrastructure/redis/.gitkeep`, `Create: infrastructure/qdrant/.gitkeep`, `Create: infrastructure/minio/.gitkeep`, `Create: infrastructure/README.md`

- [x] **3.2 运行测试并确认失败**

Run: `powershell -NoProfile -Command "$paths = 'infrastructure/postgres','infrastructure/redis','infrastructure/qdrant','infrastructure/minio','infrastructure/README.md'; $paths | ForEach-Object { '{0}:{1}' -f $_, (Test-Path $_) }"`
Expected: FAIL with one or more infrastructure entries reported as `False`

- [x] **3.3 实现最小化代码**

```markdown
# Infrastructure

本目录仅承载本地开发基础设施入口：
- postgres
- redis
- qdrant
- minio

当前不承诺生产级部署编排。
```

**Files**: `Create: infrastructure/postgres/.gitkeep`, `Create: infrastructure/redis/.gitkeep`, `Create: infrastructure/qdrant/.gitkeep`, `Create: infrastructure/minio/.gitkeep`, `Create: infrastructure/README.md`
**Interfaces**: Produces `local infrastructure entry baseline` — 为后续本地依赖编排提供固定入口

- [x] **3.4 运行测试并确认通过**

Run: `powershell -NoProfile -Command "$paths = 'infrastructure/postgres','infrastructure/redis','infrastructure/qdrant','infrastructure/minio','infrastructure/README.md'; $paths | ForEach-Object { '{0}:{1}' -f $_, (Test-Path $_) }"`
Expected: PASS with every infrastructure entry reported as `True`

- [x] **3.5 提交**

```bash
git add infrastructure
git commit -m "feat: 初始化本地基础设施入口基线"
```

## 4. Batch 4: 补齐根说明文档与本地辅助目录约束

- [x] **4.1 编写失败的测试**

```text
检查 README.md 是否说明：
- Monorepo 顶层结构
- phase-1 app/package 边界
- infrastructure 仅为本地开发入口

检查 .codex/README.md 是否存在并说明该目录不属于业务工程基线。
```

**Files**: `Modify: README.md`, `Create: .codex/README.md`

- [x] **4.2 运行测试并确认失败**

Run: `powershell -NoProfile -Command "$readme = if (Test-Path README.md) { Get-Content README.md -Raw } else { '' }; $codex = if (Test-Path '.codex/README.md') { Get-Content '.codex/README.md' -Raw } else { '' }; @($readme -match 'apps/', $readme -match 'packages/', $readme -match 'infrastructure', $codex -match 'Codex')"`
Expected: FAIL with one or more required README assertions returning `False`

- [x] **4.3 实现最小化代码**

```markdown
# DocWeave

本仓库当前采用 Monorepo 顶层工程壳：
- apps/
- packages/
- infrastructure/

infrastructure/ 当前只服务本地开发入口，不代表完整生产编排。
```

**Files**: `Modify: README.md`, `Create: .codex/README.md`
**Interfaces**: Produces `root onboarding docs` — 为后续开发者提供统一工程入口与范围说明

- [x] **4.4 运行测试并确认通过**

Run: `powershell -NoProfile -Command "$readme = Get-Content README.md -Raw; $codex = Get-Content '.codex/README.md' -Raw; @($readme -match 'apps/', $readme -match 'packages/', $readme -match 'infrastructure', $codex -match 'Codex')"`
Expected: PASS with all required README assertions returning `True`

- [x] **4.5 提交**

```bash
git add README.md .codex/README.md
git commit -m "docs: 补充 monorepo 根说明与本地辅助目录约束"
```
