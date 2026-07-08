import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { FilePlus } from 'lucide-react'
import { toSpaceSummaryViewModel } from '@/features/spaces/lib'
import type { ApiSpace } from '@/lib/api'

export function SpaceSummaryCard({
  space,
  documentCount,
  onCreateDocument,
}: {
  space: ApiSpace
  documentCount: number
  onCreateDocument: () => void
}) {
  const view = toSpaceSummaryViewModel(space)

  return (
    <Paper
      className="soft-panel"
      p={{ base: 'lg', md: 'xl' }}
      radius="lg"
    >
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="lg">
        <Stack gap={0} flex={1} miw={0}>
          <Group gap="xs" mb={8}>
            <div className="leading-dot" />
            <Text className="section-eyebrow">空间</Text>
          </Group>
          <Title order={2}>{view.name}</Title>
          <Text className="section-description" mt={4} maw={640}>{view.summaryText}</Text>
          <Text className="section-count" mt={8}>{documentCount} 篇文档</Text>
        </Stack>
        <Button leftSection={<FilePlus size={16} />} onClick={onCreateDocument}>
          新建文档
        </Button>
      </Group>
    </Paper>
  )
}
