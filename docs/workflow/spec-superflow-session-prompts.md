# spec-superflow Session Prompts

适用场景：在新的 agent 会话里，快速把任务正确带入 `spec-superflow`。

## 1. 开始一个新需求

```text
按 spec-superflow 工作流开始一个新 change。
需求：<一句话描述需求>
约束：<一句话描述边界>
先用 workflow-start 判断阶段，先不要直接写代码。
```

## 2. 继续已有 change

```text
继续 `changes/<change-name>`。
按 spec-superflow 先检查当前 state、工件和下一步，再继续推进。
```

## 3. 开始实现

```text
`changes/<change-name>` 的 proposal/specs/design/tasks 已确认。
根据 execution-contract.md，按 spec-superflow 开始实现。
```

## 4. 调整需求

```text
`changes/<change-name>` 需求有调整。
不要直接继续实现，按 spec-superflow 先判断回退到 specifying 还是 bridging，并更新相关工件。
变更点：<具体变化>
```

## 5. 进入收口

```text
继续 `changes/<change-name>`。
按 spec-superflow 进入 closing 收口，先检查 tasks.md、.spec-superflow.yaml、decision-point-audit.md 和验证状态，再继续。
```

## 6. 最小使用原则

新会话第一句话，尽量明确这三件事：

1. 要不要按 `spec-superflow`
2. 是新 change 还是旧 change
3. 这次目标是规划、实现、调整，还是收口