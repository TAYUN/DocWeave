# Frontend Adonis API Client Guide

本文档约定 `apps/web` 如何通过 `Tuyau` 消费 `apps/api` 导出的类型安全 API registry，并说明后续新增接口时的推荐流程。

## 官方参考

遇到本地封装未覆盖的特殊场景，或需要确认官方推荐接法时，优先查下面两份文档：

1. [AdonisJS Frontend API client](https://docs.adonisjs.com/guides/frontend/api-client)
2. [AdonisJS Frontend TanStack Query](https://docs.adonisjs.com/guides/frontend/tanstack-query)

## 适用范围

- 前端位于 `apps/web`
- 后端位于 `apps/api`
- 后端通过 `@tuyau/core/hooks` 生成 `apps/api/.adonisjs/client/*`
- 前端通过 `@docweave/api/registry` 访问后端路由定义

## 当前基线

当前项目采用下面的分层：

1. `apps/api/app/controllers/*`：后端控制器，负责 HTTP 语义和业务边界。
2. `apps/api/app/validators/*`：请求体验证入口，负责把字段约束显式化。
3. `apps/api/.adonisjs/client/*`：Adonis + Tuyau 自动生成的 registry，不手改。
4. `apps/web/src/lib/tuyau-client.ts`：前端唯一的 Tuyau client 创建入口。
5. `apps/web/src/lib/api.ts`：前端统一 API 封装层，页面和查询逻辑只从这里取能力。
6. `packages/contracts`：跨边界稳定 DTO / input 定义层。
7. `packages/adapters`：DTO、内容结构与兼容转换的统一适配层。
8. `packages/shared`：前后端共享运行时常量目录，例如错误码默认文案。
9. `apps/web/src/features/*/lib/*view-model.ts`：页面展示友好结构的统一收口点。

更完整的边界说明，见 [数据契约与适配层设计](../architecture/05.%20数据契约与适配层设计.md)。

## 前端编译配置注意点

因为 `apps/web` 会消费 `apps/api` 导出的 workspace 源码类型，而这些类型会间接经过 Adonis 模型、控制器和装饰器定义，所以前端 `tsconfig` 需要允许这类语法参与类型分析。

当前项目至少要满足：

1. `experimentalDecorators: true`
2. 不要开启会拒绝装饰器语法的 `erasableSyntaxOnly`

## 为什么要求先写 Validator

如果控制器只用 `request.only(...)` 手动取字段，`Tuyau` 生成 registry 时通常拿不到准确的 body 类型。

这会带来两个问题：

1. 前端虽然接了 registry，但写接口仍然拿不到可靠的请求体提示。
2. 字段约束散落在控制器分支里，后续新增字段时容易前后端不同步。

因此，新增或修改写接口时，默认按下面顺序推进：

1. 在 `apps/api/app/validators/*` 中定义 Vine validator。
2. 控制器使用 `request.validateUsing(...)` 获取 payload。
3. 再让前端通过 `apps/web/src/lib/api.ts` 暴露调用函数。
4. 若接口跨边界 shape 有变化，优先先调整 `packages/contracts` 与 `packages/adapters`，不要直接让页面吃新的原始返回结构。

## 推荐工作流

### 1. 新增后端接口

先在控制器或 service 中确定接口语义，再补 validator。

规则：

1. 字段级必填、类型、长度、格式约束优先放进 Vine validator。
2. “至少传一个字段”“只有某状态允许更新”这类业务约束继续留在控制器或 service。
3. 控制器返回结构尽量稳定，优先保持 `{ message?, data }` 这种统一外形。
4. 推荐把成功响应收口成三种最小外形：读接口 `{ data }`、带 payload 的写接口 `{ message, data }`、无 payload 成功 `{ message }`。
5. 错误响应优先统一为 `{ code?, message, errors? }`，不要让页面和 Query 层直接消费框架默认异常 shape。

### 2. 刷新 registry

`apps/api/.adonisjs/client/*` 是生成产物，不手改。

修改后端接口后，至少运行一次相关命令，确认 registry 已刷新：

```powershell
pnpm --dir apps/api typecheck
```

如果发现前端仍然拿不到最新类型，再补跑：

```powershell
pnpm --dir apps/api build
```

### 3. 扩展前端调用层

前端不要在页面里直接手写 `fetch('/api/...')`，统一经由：

- `apps/web/src/lib/tuyau-client.ts`
- `apps/web/src/lib/api.ts`

规则：

1. `tuyau-client.ts` 只负责创建 client，不放业务逻辑。
2. `api.ts` 负责把 route name、params、body、错误转换封装成稳定函数。
3. `api.ts` 优先对齐 `packages/contracts` 定义的 input / DTO，而不是把页面直接暴露给 Tuyau 推导出的偶然 shape。
4. 若接口返回 `ApiErrorResponse.code`，前端 API 层优先按错误码解释语义，`message` 只作为展示与兼容兜底。
5. 页面、路由 loader、TanStack Query hooks 只依赖 `api.ts` 暴露的函数。

这样做的目的，是把“后端路由细节变化”和“页面业务调用方式”隔开。

### 4. 页面层使用

页面层优先消费 `api.ts` 暴露的方法，不直接依赖 `@docweave/api/registry`。

这样可以保证：

1. 路由命名调整时，页面无需全仓一起改。
2. 错误消息转换逻辑只维护一份。
3. 后续接入 `@tuyau/react-query` 时可以平滑迁移，不会影响页面语义。
4. 页面仍然可以优先消费 `view-model`，而不是直接消费 transport 层 DTO。

## 当前约束

1. 不要手改 `apps/api/.adonisjs/` 下的任何文件。
2. 不要在 `apps/web` 页面组件里重新拼 `/api/...` 字符串。
3. 不要在没有 validator 的前提下，期望 Tuyau 自动推断出准确的 body 类型。
4. 新增 API 时，优先延续统一响应外形，减少前端分支判断。
5. 不要把 Tuyau 推导类型误当成业务 contract；两者职责不同。
6. `packages/contracts` 负责 `data` 内部 DTO / input shape，不默认承担 HTTP response envelope 约定。

## 推荐检查命令

完成改动后，至少运行：

```powershell
pnpm --dir apps/api typecheck
pnpm --dir apps/web exec tsc -b --pretty false
```

如果改了前后端契约，建议再补：

```powershell
pnpm check:workspace
```

## 后续演进建议

如果后面 `apps/web` 的查询层继续扩展，可以考虑把 TanStack Query 的 `queryOptions` / `mutationOptions` 也下沉到统一 API 层，但前提仍然不变：

1. 后端先有 validator。
2. registry 自动生成。
3. 页面只消费稳定封装，不直接操作底层路由细节。
