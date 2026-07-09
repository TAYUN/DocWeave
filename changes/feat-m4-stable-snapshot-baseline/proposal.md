# 变更提案

## Why

`feat-m3-collaboration-baseline` 已经让 DocWeave 具备了最小协同闭环：两个浏览器可以进入同一文档房间、同步正文并展示基础在线状态。

但当前协同正文还没有真正进入服务端稳定真相：

1. `apps/collab` 的 `onLoadDocument` 仍只返回内存 `Y.Doc`，刷新或重启后无法从服务端恢复协同正文。
2. 文档页当前依赖“空房间首帧 seed + 手动保存快照”维持可用性，这能兜底，但不是长期正文真相方案。
3. 后续索引、导出、RAG 与引用回跳都需要一个稳定、可版本化、可服务端读取的正文快照入口，不能直接依赖运行中的 Yjs 内存态。

按照当前路线图，M3 之后的下一步本来就应该是“稳定快照与索引基线”。因此现在需要新增一条 change，先把“协同正文如何进入稳定快照、协同房间如何从稳定真相恢复”收口成一个明确的 M4 基线，再把索引任务接在这个真相之后。

## What Changes

- 为文档正文建立服务端稳定快照语义，让协同态和后续系统都能读取同一份正文真相。
- 把 `apps/collab` 的 `onLoadDocument` / `onStoreDocument` 从纯 hook 边界推进到最小可用的恢复 / 持久化链路。
- 明确“协同运行态”“手动保存”“稳定快照”三者之间的职责边界，避免继续依赖前端 seed 兜底作为主要恢复方式。
- 为后续 `snapshot -> chunk -> embedding -> qdrant` 链路预留可信输入，但不在本 change 中直接落地完整索引任务。

## Capabilities

### 新增能力

- collaboration-persistence-baseline
- document-stable-snapshot-baseline
- snapshot-recovery-baseline

### 修改能力

- blocknote-yjs-collaboration-baseline
- api-metadata-route-baseline

## Scope

### In Scope

- 协同正文从服务端稳定真相恢复到 `Y.Doc`
- 协同正文写回稳定快照的最小持久化链路
- `snapshotVersion` 或等价版本语义的最小落点
- 文档页与协同服务围绕稳定快照的职责收口
- 为后续索引链路准备统一的正文输入边界

### Out of Scope

- 不在本 change 落地完整 `snapshot -> chunk -> embedding -> qdrant`
- 不在本 change 接入编辑器 AI、RAG 问答或导出任务
- 不做多节点协同扩展、Redis pub/sub 或复杂离线回放
- 不把当前 M4 一次性扩成“持久化 + 索引 + 导出 + AI”的大杂烩

## Impact

- 影响的代码区域：`apps/api`、`apps/collab`、`apps/web`、`packages/contracts`、可能新增承接快照语义的共享包或数据库层
- 影响的 API 或接口：文档读取 / 保存链路、协同服务 `onLoadDocument` / `onStoreDocument`、后续 snapshot 读取入口
- 影响的用户路径：文档正文在刷新、重连、协同恢复后的稳定回显，以及后续索引和引用能力的输入可信度
