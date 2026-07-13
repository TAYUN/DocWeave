# 执行契约

## 目标

将 API 错误处理从“共享 message 文案”升级为“共享 error code + 默认中文 message”，统一进入跨边界数据契约层，降低前后端后续维护成本。

## 范围

1. `packages/contracts` 的错误契约升级
2. `packages/shared` 的共享错误目录常量
3. `apps/api` 错误码与默认文案映射收口
4. `apps/web/src/lib/api.ts` 基于 `code` 的归一化消费
5. 与本次契约升级直接相关的测试与文档同步

## 批次

### Batch 1

- 新增 `ApiErrorCode`
- 扩展 `ApiErrorResponse`
- 建立 `packages/shared` 共享错误目录
- 建立后端统一错误码/默认文案映射 wrapper
- 更新架构与 API client 指南

### Batch 2

- `HttpExceptionHandler` 与显式控制器分支接入 `code`
- 前端 API 层优先按 `code` 归一化错误
- 清理前后端重复的错误文案耦合

### Batch 3

- 补齐功能测试断言
- 运行类型检查与目标测试
- 回写 tasks / 状态文件

## 风险控制

1. 保持 `message` 兼容，不做破坏性删除
2. 让 `code` 先以可选字段进入 contract，降低迁移风险
3. 所有已知 4xx/5xx 顶层响应都优先补 `code`，避免“部分接口有、部分没有”的长期漂移
