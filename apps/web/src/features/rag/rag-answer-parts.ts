import type { RagCitationViewModel } from './lib'

export type RagAnswerPart =
  | { type: 'text'; value: string }
  | { type: 'citation'; citation: RagCitationViewModel; index: number }

/**
 * 将模型文本里的内部 Citation ID 映射为当前回答内的短序号。
 * 只匹配流中已返回的来源，避免把用户或模型普通文本中的方括号误当成 Citation。
 */
export function toRagAnswerParts(answer: string, citations: RagCitationViewModel[]): RagAnswerPart[] {
  if (!answer || citations.length === 0) {
    return answer ? [{ type: 'text', value: answer }] : []
  }

  const citationsByToken = new Map<string, { citation: RagCitationViewModel; index: number }>()
  citations.forEach((citation, index) => {
    const reference = { citation, index: index + 1 }
    for (const token of getCitationTokens(citation)) {
      // 出现不完整的同名 token 时，保留检索排序更靠前的来源，避免 Citation 序号漂移。
      if (!citationsByToken.has(token)) citationsByToken.set(token, reference)
    }
  })
  const tokens = [...citationsByToken.keys()].sort((left, right) => right.length - left.length)
  const parts: RagAnswerPart[] = []
  let cursor = 0

  while (cursor < answer.length) {
    const match = tokens
      .map((token) => ({ token, position: answer.indexOf(token, cursor) }))
      .filter((candidate) => candidate.position >= 0)
      .sort((left, right) => left.position - right.position || right.token.length - left.token.length)[0]

    if (!match) {
      parts.push({ type: 'text', value: answer.slice(cursor) })
      break
    }

    if (match.position > cursor) {
      parts.push({ type: 'text', value: answer.slice(cursor, match.position) })
    }

    const reference = citationsByToken.get(match.token)
    if (reference) {
      parts.push({ type: 'citation', ...reference })
    }
    cursor = match.position + match.token.length
  }

  return parts
}

function getCitationTokens(citation: RagCitationViewModel) {
  const stableToken = `[${citation.id}]`
  const prefix = `${citation.documentId}:${citation.snapshotVersion}:${citation.blockId}:`

  // 当前索引 ID 含有 blockId 与 chunkId；模型上下文会把重复的 blockId 简写掉。
  // 两种表示均受当前 Citation 元数据约束，不能匹配任意方括号内容。
  if (!citation.id.startsWith(prefix)) return [stableToken]

  return [stableToken, `[${citation.documentId}:${citation.snapshotVersion}:${citation.id.slice(prefix.length)}]`]
}
