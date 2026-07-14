import { Paper, Stack, Text } from '@mantine/core'
import type { RagCitationViewModel } from './lib'
import { CitationLink } from './citation-link'

export function RagCitations({ citations }: { citations: RagCitationViewModel[] }) {
  if (!citations.length) {
    return <Text size="sm" c="dimmed">本次回答没有可跳转的来源。</Text>
  }

  return (
    <Stack gap="xs">
      {citations.map((citation) => (
        <Paper key={citation.id} withBorder p="sm" radius="sm">
          <Stack gap={4}>
            <CitationLink citation={citation} label={`[${citation.id}] 查看来源`} />
            {citation.quote ? <Text size="sm" lineClamp={3}>{citation.quote}</Text> : null}
          </Stack>
        </Paper>
      ))}
    </Stack>
  )
}
