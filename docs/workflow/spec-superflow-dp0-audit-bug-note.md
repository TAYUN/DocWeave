# spec-superflow DP-0 审计不一致问题记录

## 现象

在 `spec-superflow 0.8.9` 中，某些 change 的 `.spec-superflow.yaml` 已包含：

- `dp_0_decisions`
- `dp_0_confirmed: true`
- `dp_0_timestamp`

并且 `ssf state check` 显示状态与工件一致，但 `ssf audit` 生成的 `decision-point-audit.md` 仍会把 DP-0 标记为 `not recorded`。

## 稳定复现

1. 通过 `workflow-start` 正常完成 DP-0
2. 状态文件只写入 `dp_0_decisions`、`dp_0_confirmed`、`dp_0_timestamp`
3. 运行 `ssf audit <change-dir>`
4. 审计报告中 DP-0 显示 `not recorded`

## 根因

这个问题实际上由两层不一致叠加造成：

1. `workflow-start` 的 DP-0 指引只要求写入：
   - `dp_0_decisions`
   - `dp_0_confirmed`
   - `dp_0_timestamp`

2. `cmd-audit.mjs` 生成审计报告时，只读取 `dp_0_result` 作为 DP-0 的“记录结果”

3. `cmd-state.mjs` 虽然把 `dp_0_result` 列入了 `SETTABLE_FIELDS`，但 `state-loader.mjs`：
   - `BUILTIN_DEFAULTS` 中没有 `dp_0_result`
   - `writeState()` 中也没有输出 `dp_0_result`

这会导致：

- `ssf state set <change-dir> dp_0_result ...` 表面成功
- 但 `.spec-superflow.yaml` 实际不会持久化这个字段
- 所以 `ssf audit` 仍然会把 DP-0 当成 `not recorded`

## 受影响代码

- `scripts/lib/cmd-audit.mjs`
- `scripts/lib/cmd-state.mjs`
- `scripts/lib/state-loader.mjs`
- `skills/workflow-start/SKILL.md`

## 建议修复

### 最小代码修复

在 `scripts/lib/state-loader.mjs` 中补齐 `dp_0_result` 的读写支持：

1. `BUILTIN_DEFAULTS` 增加 `dp_0_result: null`
2. `writeState()` 在 DP-0 区域输出 `dp_0_result`

这样至少可以保证：

- `ssf state set ... dp_0_result ...` 能真正落盘
- `ssf audit` 读取到 `dp_0_result` 后不再误报

### 一致性修复

为了让工作流和审计口径一致，建议再补一项：

1. `workflow-start/SKILL.md` 在 DP-0 写入步骤里增加：
   - `ssf state set <change-dir> dp_0_result "<confirmed: ...>"`

或者：

2. `cmd-audit.mjs` 对 DP-0 使用兜底逻辑：
   - 优先读 `dp_0_result`
   - 如果缺失但 `dp_0_confirmed === true`，则视为已记录

## 推荐修复顺序

推荐先做这两步：

1. 修 `state-loader.mjs`
2. 更新 `workflow-start/SKILL.md`

原因：

- 改动小
- 与当前 `audit` 逻辑兼容
- 不需要改变已有 DP-1~DP-7 的判定方式
- 可以避免出现“命令成功但字段没落盘”的误导行为

## 建议补充测试

1. `cmd-state` / `state-loader`
   - 设置 `dp_0_result` 后重新读取，断言字段仍存在

2. `cmd-audit`
   - 当 `dp_0_result` 存在时，DP-0 应显示 recorded

3. `workflow-start`
   - 文档或集成测试确保 DP-0 写入链路包含 `dp_0_result`
