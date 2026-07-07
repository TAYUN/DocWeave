# spec-superflow Closing SOP

适用场景：change 已实现完成，准备从 `executing` 收口到 `closing`。

## 1. 先确认验证已完成

- 重新运行这条 change 需要的验证命令
- 确认真正通过后，再回填状态

## 2. 同步 `tasks.md`

- 把已完成任务全部改成 `- [x]`
- `executing -> closing` 前不能保留任何 `- [ ]`

## 3. 同步 `.spec-superflow.yaml`

- `test_result` 必须写成精确的 `pass`
- 补齐当前阶段缺失的 `dp_*` 记录，至少保证收口需要的审批和验证结果已记录

## 4. 更新哈希

- 修改过 `proposal.md`、`specs/`、`design.md`、`tasks.md` 后，先执行：

```bash
ssf state rebuild "<change-dir>"
```

否则 `contract-fresh` 会因为 `artifacts_hash` 过期而失败。

- 如果 `ssf audit "<change-dir>"` 已经显示状态是 `closing`，但 `ssf state check "<change-dir>"` 仍提示 `artifacts have changed since last transition`，优先执行一次：

```bash
ssf state rebuild "<change-dir>"
ssf state check "<change-dir>"
```

这通常表示工件或审计文件在最后一次 transition 后又发生了更新，需要把派生状态哈希重新同步，而不代表必须回退整个 change。

## 5. 用绝对路径推进状态

- 优先使用绝对路径执行 transition，避免相对路径被 guard 误判工件缺失

```bash
ssf state transition "<absolute-change-dir>" approved-for-build
ssf state transition "<absolute-change-dir>" executing
ssf state transition "<absolute-change-dir>" closing
```

## 6. 优先走统一收口脚本

在 DocWeave 仓库里，进入 `closing` 时优先直接执行 Node 收口脚本，而不是手工拆着跑：

```bash
node "D:\code-my\DocWeave\.agents\skills\spec-superflow-closing\scripts\close-change.mjs" "D:\code-my\DocWeave\changes\<change-name>"
```

这个脚本会统一检查：

- `tasks.md` 是否还残留 `- [ ]`
- `.spec-superflow.yaml` 是否补齐 `test_result` 与关键 `dp_*` 字段
- `ssf state rebuild`
- `ssf state check`
- `ssf audit`

只有在脚本执行成功后，才应把当前 change 视为完成了 closing 收口。

## 7. 生成审计报告

```bash
ssf audit "<change-dir>"
```

归档时把 `decision-point-audit.md` 一起纳入 Git。
