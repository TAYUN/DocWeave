# 执行契约

## 1. 执行背景

本 change 属于一次“实现已完成后的补档收口型 tweak”，目标不是重新规划完整开发过程，而是把已经落地的响应契约统一与 Tuyau 类型兼容修复补齐为可审计的 spec-superflow 工件。

## 2. 执行目标

本次执行只承诺交付以下结果：

1. `packages/contracts` 提供共享响应 envelope 基元
2. 前端 API 层与相关 functional tests 复用共享响应契约
3. `POST /api/rag/search` 请求体字段从 `query` 调整为 `searchText`
4. Tuyau registry 恢复稳定推导，`tuyau.api.spaces` / `documents` 不再退化为 `unknown`
5. 与本轮修改直接相关的架构/规划文档同步完成

## 3. 执行边界

本次执行明确不包含：

1. 不重做现有 controller 的运行时 envelope 规则
2. 不引入 `{ code, data, msg }` 三段式协议
3. 不纳入已单独提交的 `apps/web/src/pages/documents/document-editor-page.tsx` lint 修复
4. 不扩展为真实 RAG 检索实现或新的前端搜索交互

## 4. 执行批次

### Batch 1：共享响应契约收口

- 在 `packages/contracts` 增加共享 envelope 基元
- 补齐 `LoginResultDto`、`CollaborationSessionDto`
- 修改前端 API 层与相关测试，复用共享契约

### Batch 2：Tuyau 兼容修复

- 将 `/api/rag/search` 的 body 字段更名为 `searchText`
- 重新生成并验证 registry 类型
- 更新相关测试与文档

## 5. 验证承诺

本次执行完成后，至少需要满足：

1. `pnpm --dir apps/web exec tsc -b --pretty false` 通过
2. `pnpm --dir apps/api typecheck` 通过
3. `pnpm check:workspace` 通过
4. 相关 API functional tests 通过

## 6. 收口说明

由于本 change 是补档型 tweak，本执行契约用于把“已经完成的实现”映射回可审计的执行边界，而不是替代完整的前置设计与执行编排流程。
