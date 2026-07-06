import vine from '@vinejs/vine'

/**
 * 统一文档创建入参，避免前后端分别维护一份字段约束。
 */
export const createDocumentValidator = vine.create({
  spaceId: vine.string().trim().minLength(1),
  title: vine.string().trim().minLength(1),
  summary: vine.string().trim().minLength(1),
})

/**
 * 更新接口允许局部提交，但字段一旦出现就必须满足基础类型要求。
 * “至少更新一个字段”的业务约束仍由控制器补充校验。
 */
export const updateDocumentValidator = vine.create({
  title: vine.string().trim().optional(),
  summary: vine.string().trim().optional(),
  content: vine.string().optional(),
})
