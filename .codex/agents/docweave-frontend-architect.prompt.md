# docweave-frontend-architect 调用模板

这个模板用于调用 `docweave-frontend-architect` 审核 DocWeave 前端的实现架构一致性。

适用场景：

- 拆分或重构 `apps/web/src/router.tsx`
- 新增前端页面，担心继续把路由、布局、页面和业务区块混写
- 审核 `layout / routes / pages / features` 是否串层
- 在 UI 大改版前，先确认代码组织边界而不是先写页面

不适用场景：

- 单纯评价页面好不好看
- 只做页面目标、信息架构或状态规格定义
- 纯 API 契约或业务行为回归审查

## 标准模板

```text
请你作为 `docweave-frontend-architect`，审核这次前端改动/方案是否符合 DocWeave 的前端实现架构约定。

审查范围：
- 目标：<一句话说明这次改动要解决什么问题>
- 文件/模块范围：
  - <文件或目录 1>
  - <文件或目录 2>
- 重点关注：
  - 路由拆分是否合理
  - layout / routes / pages / features 是否串层
  - 是否有继续堆大 `router.tsx` 或万能页面文件的风险
  - 是否偏离 `docs/workflow/frontend-route-architecture.md`

请按下面格式输出：
1. findings 优先，按严重度排序
2. 每条问题说明：
   - 问题在哪里
   - 为什么这会增加耦合或后续扩展成本
   - 建议把职责移到哪一层
3. 如果没有明确问题，请写“未发现明确架构缺陷”，并补充残余风险
```

## 快速模板

```text
请用 `docweave-frontend-architect` 的标准，从前端实现架构角度审查这次改动，重点看：
- 是否遵守 `docs/workflow/frontend-route-architecture.md`
- 是否把 layout / routes / pages / features 混写
- 是否留下继续膨胀 `apps/web/src/router.tsx` 的风险
```

## 当前项目示例

```text
请你作为 `docweave-frontend-architect`，审核当前 DocWeave 前端路由重构规划是否足够清晰，是否能有效约束后续 AI 不再把页面堆回 `apps/web/src/router.tsx`。

审查范围：
- `docs/workflow/frontend-route-architecture.md`
- `docs/ui/page-inventory.md`
- `apps/web/src/router.tsx`

重点关注：
- 文档里定义的 `layout / routes / pages / features` 边界是否足够明确
- 当前 `router.tsx` 中的页面、布局和工具函数迁移落点是否合理
- 是否还有容易导致“万能 route 文件”回潮的模糊区

请按 findings 优先输出；如果没有明确问题，也请给出残余风险。
```
