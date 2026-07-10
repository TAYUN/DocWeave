import vine from '@vinejs/vine'

// 这些接口目前仍处在最小 runtime/scaffold 阶段，先用一份集中 validator
// 收住 request shape；如果后续能力继续长大，再按领域拆文件。
export const collaborationTokenValidator = vine.create({
  documentId: vine.string().trim().minLength(1),
})

export const aiEditorRequestValidator = vine.create({
  documentId: vine.string().trim().optional(),
  instruction: vine.string().trim().minLength(1),
})

export const ragSearchValidator = vine.create({
  // 避免与 Tuyau endpoint meta 的 query 字段重名，导致 registry 类型退化。
  searchText: vine.string().trim().minLength(1),
})

export const ragChatValidator = vine.create({
  message: vine.string().trim().minLength(1),
})
