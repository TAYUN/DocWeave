# DocWeave Design Guide

本文档用于约定 DocWeave 的前端设计基线，但它不是独立于 `Mantine` 的第二套样式系统。

在当前项目里，设计约定必须优先落到以下实现入口：

1. `MantineProvider`
2. `createTheme(...)`
3. `Styles API / classNames / styles`
4. `CSS Modules`

也就是说，`DESIGN.md` 负责回答“界面应该呈现什么气质、优先使用什么组件语言、哪些实现方式是推荐的”，而不是替代 `Mantine` 的 theme 配置本身。

## 1. 当前 Mantine 基线

当前仓库已经明确采用 `Mantine` 作为产品 UI 的主设计系统，基线以 Mantine 官方设计为准。

当前已落地的关键设定包括：

- 根部统一挂载单个 `MantineProvider`
- `defaultColorScheme` 为 `light`
- `primaryColor` 使用自定义 `cinnamon`
- 正文字体使用 `Segoe UI, PingFang SC, Microsoft YaHei, sans-serif`
- 标题字体使用 `Georgia, Times New Roman, serif`
- `defaultRadius` 为 `md`

后续如果 `DESIGN.md` 与实际 theme 配置不一致，以代码中的 `createTheme(...)` 为最终事实来源；文档应随后补齐，而不是各自漂移。

## 2. 设计目标

DocWeave 的产品气质应该更接近“编辑工作台”而不是“通用后台模板”。

我们希望界面呈现出这些特征：

- 偏暖的纸面感背景，而不是生硬的纯白后台
- 有编辑器产品气质的层级感，而不是营销站式的大视觉冲击
- 标题更像出版物或文稿工作台，正文与操作区保持高可读性
- 圆角、边框、阴影都要克制，强调稳定与可读，而不是炫技
- 品牌强调色只用于行动点、当前状态和局部重点，不把整页染满

## 3. Mantine-First 规则

### 3.1 先用 Mantine 原生能力

新增界面时，优先按这个顺序选方案：

1. 先看 `Mantine` 现成组件能不能直接表达
2. 再看 theme override 能不能解决
3. 再看 `Styles API`、`classNames`、`styles`
4. 最后才补 `CSS Modules`

不推荐一上来就写大量独立 CSS，把 `Mantine` 只当成一个“顺手装了的组件库”。

### 3.2 不要平行造第二套组件语言

下面这些元素优先使用 `Mantine` 原语及其组合：

- 页面骨架：`AppShell`、`Container`、`Paper`、`Stack`、`Group`
- 表单：`TextInput`、`Textarea`、`Select`、`Checkbox`、`Switch`
- 操作：`Button`、`ActionIcon`、`Menu`、`Tabs`、`Modal`、`Drawer`
- 反馈：`Notification`、`Alert`、`Tooltip`、`Skeleton`

如果某个交互需要自定义样式，也应尽量建立在这些原语之上，而不是绕开它们重做一套视觉语言。

### 3.3 Tailwind 的角色

项目允许继续使用 `Tailwind CSS v4`，但角色应限制在：

- 布局辅助
- 少量间距或响应式微调
- 临时性的低风险样式补充

不要用 `Tailwind` 重新定义按钮、表单、弹层、导航这些本该由 `Mantine` 统一的组件层。

## 4. Theme Token 方向

这里描述的是主题方向，不是要求把所有 token 原封不动写进文档里维护两份。

### 4.1 颜色

当前主色方向是 `cinnamon`，应继续作为以下场景的主强调色：

- 主按钮
- 当前激活导航
- 关键确认动作
- 局部高亮状态

背景与表面色应保持暖色、低刺激、可长时间阅读：

- 页面外层背景避免冷白
- 卡片、侧栏、编辑器周边表面要与页面背景有轻微层次差
- 边框优先用于建立结构感，而不是制造强烈分割

语义色应保持克制：

- 成功态、警告态、危险态只用于明确反馈
- 焦点态必须清晰可见，不能为了“干净”去掉 focus ring

### 4.2 字体

字体策略保持当前双栈：

- 标题使用衬线字体，强调文档产品气质
- 正文、控件、表格、说明文字使用无衬线字体，保证长时间操作可读性

不要把整站都做成营销式的大号 serif，也不要把所有标题都抹平成纯工具后台口吻。

### 4.3 圆角与阴影

- 默认圆角应维持 `md` 到 `lg` 的柔和区间
- 阴影用于弱分层，不做玻璃感和漂浮感
- 多层嵌套时优先减少阴影数量，而不是不断叠效果

## 5. 页面与组件倾向

### 5.1 工作台页面

工作台、概览页、空间页应优先体现“稳定的阅读与操作框架”：

- 页面结构清晰
- 信息分组明确
- 首屏能看出主操作区和辅助信息区

### 5.2 编辑器相关界面

编辑器页面、AI 辅助面板、引用侧栏、元数据编辑区，应该属于同一个工作台家族。

这类界面要遵守：

- 可读性优先于装饰
- 让 `BlockNote` 负责正文编辑体验
- 让 `Mantine` 负责编辑器外围的产品 chrome
- 不要对正文区域做过度包装，避免抢走内容本身的注意力

### 5.3 表单与设置页

- 标签必须清晰可见，不依赖 placeholder 传达字段含义
- 校验反馈要靠近字段
- 密集设置页依赖间距、标题和分组建立秩序，不依赖五颜六色的强调块

### 5.4 状态与反馈

- 空状态要有明确下一步动作
- 加载态要安静，不做花哨动画
- 错误反馈要明确指出失败原因和下一步建议

## 6. 样式落地边界

### 6.1 适合放进 `createTheme(...)` 的内容

- `primaryColor`
- 字体族
- `defaultRadius`
- 全局颜色 scale
- 组件级默认 props
- 共享的 `Mantine` 组件样式覆写

### 6.2 适合放进 `Styles API` / `classNames` / `styles` 的内容

- 单个组件或一组组件的局部视觉调整
- 某个组件在不同页面语境下的样式差异
- 需要根据组件内部 slot 精细控制的样式

### 6.3 适合放进 `CSS Modules` 的内容

- 页面级排版
- 复合布局
- Mantine 原语外层的容器样式
- 无法靠 theme 和 Styles API 清晰表达的局部结构样式

### 6.4 不适合放进 `DESIGN.md` 的内容

- 组件的完整 props 列表
- 某个页面的逐像素视觉说明
- 与实际代码脱节的第二份 token 真值表
- 替代官方文档的 Mantine API 描述

## 7. Agent 使用说明

当 agent 为 DocWeave 生成或修改前端代码时，应遵循下面的顺序：

1. 先阅读当前 `MantineProvider` 和 theme 配置
2. 优先复用现有 `Mantine` 组件与项目中的页面语言
3. 需要扩展时，先判断是 theme 问题、组件问题还是页面布局问题
4. 只有在 `Mantine` 原生能力不够时，才增加局部自定义样式
5. 新页面必须看起来属于 DocWeave，而不是另一个独立产品

## 8. 官方资料优先级

涉及 `Mantine` 用法时，优先参考官方资料，而不是凭印象写：

1. Getting Started: [https://mantine.dev/getting-started/](https://mantine.dev/getting-started/)
2. Mantine Provider: [https://mantine.dev/theming/mantine-provider/](https://mantine.dev/theming/mantine-provider/)
3. Theme Object: [https://mantine.dev/theming/theme-object/](https://mantine.dev/theming/theme-object/)
4. Mantine Styles: [https://mantine.dev/styles/mantine-styles/](https://mantine.dev/styles/mantine-styles/)
5. Styles API: [https://mantine.dev/styles/styles-api/](https://mantine.dev/styles/styles-api/)

## 9. 一句话结论

DocWeave 的 `DESIGN.md` 应该始终是一个 `Mantine-first` 的设计约束文档：

- 它定义设计方向
- 它约束组件语言
- 它指导 theme 与样式该落在哪一层
- 但它不替代 `Mantine` 自己的 theme、Styles API 和官方样式体系
