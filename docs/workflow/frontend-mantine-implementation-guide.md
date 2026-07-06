# Frontend Mantine Implementation Guide

本文档承接 [`DESIGN.md`](../../DESIGN.md) 的设计规范，专门回答 DocWeave 在前端实现层应该如何落地 `Mantine` 官方默认主题。

一句话边界：

- `DESIGN.md` 说明界面应该看起来像什么
- 本文档说明代码里应该怎么实现，才能尽量贴近那个设计目标

## 适用范围

这份文档适用于：

- 规定 `MantineProvider` 与默认主题的实现口径
- 规定组件 props 默认如何取舍
- 规定哪些值优先依赖组件默认行为
- 规定页面级 CSS、Mantine props 和 theme 的实现边界

这份文档不适用于：

- 定义产品品牌气质
- 定义视觉风格方向
- 定义状态在视觉上“应该长什么样”
- 定义整体设计语言

以上设计问题统一交给根目录 [`DESIGN.md`](../../DESIGN.md)。

---

## 1. Source of Truth

当前实现事实来源按优先级排序如下：

1. [apps/web/src/main.tsx](../../apps/web/src/main.tsx)
2. `MantineProvider`
3. `@mantine/core@9.4.1` 默认主题实现
4. 页面组件代码
5. 页面级 CSS

当前约定：

- 不向 `MantineProvider` 传入自定义 `theme`
- 不覆盖 `primaryColor`
- 不覆盖 `defaultRadius`
- 不覆盖默认字体栈
- 不覆盖默认阴影 scale

---

## 2. Default Theme Tokens

以下值以当前安装版本 `@mantine/core@9.4.1` 的默认主题为准：

- `primaryColor`: `blue`
- `primaryShade`: `light: 6`，`dark: 8`
- `defaultRadius`: `md`
- `radius`: `xs=2px`、`sm=4px`、`md=8px`、`lg=16px`、`xl=32px`
- `fontFamily`: Mantine 默认系统无衬线字体栈
- `headings.fontFamily`: 与正文同一套默认字体栈
- `headings.fontWeight`: `700`
- `fontSizes`: `xs=12px`、`sm=14px`、`md=16px`、`lg=18px`、`xl=20px`
- `spacing`: `xs=10px`、`sm=12px`、`md=16px`、`lg=20px`、`xl=32px`
- `lineHeights`: `xs=1.4`、`sm=1.45`、`md=1.55`、`lg=1.6`、`xl=1.65`
- `focusRing`: `auto`

说明：

- 默认主题提供 `shadow` token，但不代表代码里默认应显式写 `shadow`
- 更贴近官方默认的做法是：默认不传 `shadow`

---

## 3. Default-First Props Policy

DocWeave 前端实现遵循 `default-first` 原则。

默认情况下，先不传以下 props：

- `color`
- `radius`
- `shadow`
- `size`
- `variant`

实现顺序：

1. 先使用组件默认行为
2. 如果默认行为满足需求，则不要再补 props
3. 只有默认行为不能满足交互、状态或层级时，才显式指定

---

## 4. Explicit Props Rules

如果必须显式指定，但组件本身没有更明确默认值约束，则统一优先采用 Mantine 默认 token：

- `color`: `blue`
- `radius`: `md`
- `fontSize`: `md`
- `spacing`: `md`

以下 props 不应出于“统一风格”习惯被默认写死：

- `shadow`
- `variant`
- `size`

原因：

- `shadow` 是层级决策，不是默认视觉装饰
- `variant` 是状态与主次决策，不是默认皮肤
- `size` 是密度和点击面积决策，不是默认风格

---

## 5. Component Implementation Rules

### 5.1 Paper

默认写法：

- 优先 `withBorder`
- 默认不写 `shadow`
- 默认不写 `radius`

允许显式指定：

- 当确实需要圆角统一时，可写 `radius="md"`
- 当确实需要轻层级时，可考虑 `shadow="xs"`

### 5.2 Button

默认写法：

- 默认不写 `color`
- 默认不写 `radius`
- 默认不写 `size`

允许显式指定：

- 主次操作区分明显时，才写 `variant`
- 危险动作时，才写 `color="red"`

### 5.3 Badge

默认写法：

- 默认不写 `color`
- 默认不写 `radius`
- 默认不写 `variant`

允许显式指定：

- 成功状态：`color="green"`
- 警告状态：`color="yellow"` 或 `color="orange"`
- 错误状态：`color="red"`

### 5.4 ThemeIcon

默认写法：

- 默认不写 `color`
- 默认不写 `radius`
- 默认不写 `size`

允许显式指定：

- 仅在图标需要承担明确状态语义时，才显式传色

### 5.5 TextInput / Textarea

默认写法：

- 默认不写 `radius`
- 优先使用组件默认输入视觉

错误态：

- 使用组件原生 `error`
- 不自己追加红边框逻辑替代原生错误态

### 5.6 Alert / Notification

允许保留必要语义 props：

- 错误：`color="red"`，可用 `variant="light"`
- 成功：`color="green"`
- 警告：`color="yellow"` 或 `orange`
- 信息：`color="blue"` 或默认

---

## 6. State Implementation Patterns

### 6.1 Loading

- 小范围内容：`Skeleton`
- 提交按钮：使用按钮自带 `loading`
- 默认不做自定义全屏 loading 遮罩

### 6.2 Empty

空状态至少包含：

- 标题
- 一句说明
- 一个下一步动作

### 6.3 Error

默认写法：

- `Alert color="red" variant="light"`

要求：

- 说明失败原因
- 有条件时给出下一步建议

### 6.4 Success

默认写法：

- `Notification` 或轻量成功提示

要求：

- 成功反馈简短明确
- 不抢主流程视觉焦点

### 6.5 Restricted / Unavailable

要求：

- 保持普通页面结构
- 清楚说明不能执行的原因
- 不实现成另一套“品牌化错误页”

---

## 7. CSS Boundary

### 7.1 Theme Handles

如果未来确实需要进入 theme 自定义，应该放进 theme 的内容包括：

- `primaryColor`
- 字体族
- `defaultRadius`
- 全局颜色 scale
- 组件默认 props
- 共享组件覆写

当前阶段默认不做这些改动。

### 7.2 Mantine Props Handle

适合用组件 props 解决的内容：

- 主次按钮变体
- 是否带边框
- 局部状态色
- 局部尺寸调整

### 7.3 Page CSS Handles

页面级 CSS 只负责：

- 布局
- 页面结构
- 区块间距
- 少量结构性修饰

页面级 CSS 不应额外叠加：

- 玻璃感
- 大渐变
- 品牌化重阴影
- 夸张 hover 动效
- 与 Mantine 默认风格明显冲突的视觉体系

---

## 8. Agent Execution Rules

当 agent 修改 DocWeave 前端时，按下面顺序执行：

1. 先确认当前仍在使用 Mantine 默认主题
2. 优先使用 Mantine 原生组件
3. 默认不传 `color/radius/shadow/size/variant`
4. 必须传时，优先使用 Mantine 默认 token
5. 页面级 CSS 只做结构，不做风格重塑
6. 如果偏离默认 Mantine 风格，必须说明原因

一句话规则：

> 先让代码像一个标准 Mantine 页面，再让它成为 DocWeave 页面。
