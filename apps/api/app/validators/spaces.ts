import vine from '@vinejs/vine'

/**
 * 让空间创建请求的必填约束进入统一校验链路，
 * 这样 Tuyau 生成 registry 时才能把 body 类型同步给前端。
 */
export const createSpaceValidator = vine.create({
  name: vine.string().trim().minLength(1),
  summary: vine.string().trim().minLength(1),
})
