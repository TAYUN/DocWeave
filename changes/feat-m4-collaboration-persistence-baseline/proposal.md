# 变更提案

## Why

`feat-m3-collaboration-baseline` 当前已经通过“空房间首帧 seed + 手动保存快照”实现了最小可用协同，但这只是阶段性兜底，不是长期方案。

后续真正稳定的协同恢复仍然需要服务端承担正文真相职责：

1. `onLoadDocument` 应从数据库中的稳定正文恢复到 `Yjs`，而不是继续依赖前端 seed。
2. `onStoreDocument` 或节流后的持久化链路应把协同运行态回写为稳定快照，避免协同内容只存在于内存或浏览器会话中。
3. “手动保存”和“自动持久化”如果职责不明确，后续会继续出现正文真相混乱、恢复语义不清和用户预期错位的问题。

这类工作比 M3 的“先把协同跑起来”更重，因此不应继续塞进当前 change，而应该保留为后续一条明确命名的独立 change，等真正需要时再按完整 planning 推进。

## What Changes

- 让 `onLoadDocument` 从数据库 `content` 或等价稳定正文恢复到 `Yjs`
- 让 `onStoreDocument` 或节流后的持久化链路把 `Yjs` 落回稳定快照
- 明确“手动保存”和“自动持久化”各自负责什么，避免职责重叠

## Capabilities

### 新增能力

- collaboration-persistence-baseline
- collaboration-server-recovery-baseline

### 修改能力

- blocknote-yjs-collaboration-baseline

## Scope

### In Scope

- `onLoadDocument` 从数据库正文恢复到 `Yjs`
- `onStoreDocument` 或节流持久化把 `Yjs` 回写到稳定快照
- 手动保存与自动持久化的职责边界说明

### Out of Scope

- 当前不直接实现
- 不把这条 change 扩成完整索引、RAG、导出或 AI 方案
- 不处理多节点协同扩展或复杂离线回放

## Impact

- 影响的代码区域：`apps/collab`、`apps/api`、`apps/web`
- 影响的 API 或接口：协同恢复 / 持久化 hooks、文档保存语义
- 影响的用户路径：刷新、重连、退出重进后的正文恢复，以及“保存”按钮的用户预期
