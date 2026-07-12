# 执行合同

## Intent Lock

- **变更名称**：`feat-m4-collaboration-persistence-baseline`
- **要解决的问题**：让协同正文不再只依赖前端 seed 或临时会话态，而是可以从服务端正文真相恢复，并在协同编辑过程中自动回写可恢复正文。
- **范围内**：
  - `apps/collab` 的 `onLoadDocument` / `onStoreDocument`
  - `apps/api` 的内部协同运行态读取/回写端点
  - `packages/adapters` 的最小服务端正文转换 helper
  - `apps/web` 文档页里 seed 从主真相降为兜底
- **范围外**：
  - 自动创建稳定快照
  - 自动触发索引任务
  - M5 AI、导出、RAG、多节点协同、队列系统
  - 重写已有的文档保存按钮语义

## Approved Behavior

- **已批准需求摘要**：
  - `onLoadDocument` 必须优先从服务端持久化正文恢复 `Y.Doc`
  - 自动持久化只更新 `documents.content`
  - 自动持久化不创建 `document_snapshots`
  - 自动持久化不前移 `latestSnapshotVersion`
  - 自动持久化不触发 `rag_index_jobs`
  - 显式 snapshot/index 仍走 M4 第一阶段已有 API
  - `apps/collab` 不直接写数据库，而是通过 `apps/api` 内部端点承接
- **关键场景**：
  - 服务端重启后重新进入文档仍能恢复正文
  - 协同房间已有内存 `Y.Doc` 时不重复拉取正文
  - 自动持久化失败时不污染快照/索引语义
  - 浏览器 seed 只在恢复为空或协同失败时兜底

## Design Constraints

- **架构约束**：
  - 当前协同恢复真相先读 `documents.content`
  - `document_snapshots` 继续只代表显式稳定快照真相
  - `packages/adapters` 负责服务端正文转换，不把第三方格式细节散进 `apps/collab`
- **接口约束**：
  - 新增的内部协同端点只负责 runtime body read/write
  - 不在内部端点中夹带 snapshot/index 副作用
- **依赖约束**：
  - 优先复用现有 `@blocknote/core/yjs`、Hocuspocus hooks、Adonis Lucid
  - 不新增复杂基础设施

## Task Batches

### Batch 1

- **目标**：建立内部协同运行态读取/回写 API
- **输出**：
  - 运行态读取/回写 contract
  - `apps/api` 内部 controller / service / middleware
  - 功能测试

### Batch 2

- **目标**：建立服务端 `content <-> Y.Doc` 转换 helper
- **输出**：
  - `packages/adapters` 新 helper
  - `apps/api` / `apps/collab` 可复用的服务端正文转换入口

### Batch 3

- **目标**：把 `apps/collab` 接到内部运行态 API
- **输出**：
  - `onLoadDocument` 服务端恢复
  - `onStoreDocument` 自动持久化
  - `apps/collab` 配置与 runtime client

### Batch 4

- **目标**：前端 seed 收口为兜底，并完成最小回归
- **输出**：
  - 文档页协同初始化调整
  - 协同回归清单补充

## Test Obligations

- **必须先从失败测试开始的行为**：
  - 内部 runtime 读取/回写端点
  - `onLoadDocument` 不再只返回空内存文档
  - 自动持久化不会创建 snapshot
- **必需的边界情况**：
  - 文档不存在
  - 空正文恢复
  - 自动持久化失败
  - 重连后仍绑定正确文档

## Execution Mode

- **模式**：`Batch Inline`
- **选择理由**：
  - 当前 planning 已经批准，且实现依赖清晰，适合按 batch 逐段落地并验证
