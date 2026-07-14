import { Text } from '@mantine/core'
import type { RagCitationViewModel } from './lib'
import { CitationLink } from './citation-link'
import { toRagAnswerParts } from './rag-answer-parts'

export function RagAnswer({
  answer,
  citations,
}: {
  answer: string
  citations: RagCitationViewModel[]
}) {
  const parts = toRagAnswerParts(answer, citations)

  return (
    <Text
      component="div"
      aria-live="polite"
      style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}
    >
      {parts.map((part, index) =>
        part.type === 'text' ? (
          <span key={`text-${index}`}>{part.value}</span>
        ) : (
          <CitationLink
            key={`citation-${part.citation.id}-${index}`}
            citation={part.citation}
            label={`[${part.index}]`}
            withIcon={false}
          />
        )
      )}
    </Text>
  )
}
