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

## 5. 用绝对路径推进状态

- 优先使用绝对路径执行 transition，避免相对路径被 guard 误判工件缺失

```bash
ssf state transition "<absolute-change-dir>" approved-for-build
ssf state transition "<absolute-change-dir>" executing
ssf state transition "<absolute-change-dir>" closing
```

## 6. 生成审计报告

```bash
ssf audit "<change-dir>"
```

归档时把 `decision-point-audit.md` 一起纳入 Git。
