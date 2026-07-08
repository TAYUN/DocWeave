import { Alert, Badge, Box, Group, Loader, Paper, Stack, Text } from '@mantine/core'
import { toDocumentPreviewViewModel } from '@/features/documents/lib/document-display'
import type { ApiDocumentSummary } from '@/lib/api'

export function RecentDocumentList({
  documents,
  error,
  isLoading,
  onOpenDocument,
}: {
  documents: ApiDocumentSummary[]
  error: Error | null
  isLoading: boolean
  onOpenDocument: (documentId: string) => void
}) {
  if (isLoading) {
    return (
      <Group gap="xs">
        <Loader size="sm" />
        <Text className="muted" size="sm">
          正在加载最近文档...
        </Text>
      </Group>
    )
  }

  if (error) {
    return (
      <Alert className="status-alert status-alert--error" color="red" variant="light">
        {error.message}
      </Alert>
    )
  }

  if (documents.length === 0) {
    return (
      <Paper className="section-card" p={{ base: 'md', md: 'lg' }} withBorder>
        <Text fw={700}>还没有文档</Text>
        <Text className="muted" mt={4} size="sm">
          进入一个空间并创建文档后，这里会显示最近更新的内容。
        </Text>
      </Paper>
    )
  }

  return (
    <Stack gap="md">
      {documents.map((document) => {
        const view = toDocumentPreviewViewModel(document)

        return (
          <Paper
            className="list-button"
            component="button"
            key={view.id}
            p="md"
            withBorder
            onClick={() => onOpenDocument(view.id)}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box flex={1} miw={0}>
                <Text fw={700}>{view.title}</Text>
                <Text className="muted" mt={4} size="sm" lineClamp={2}>
                  {view.summaryText}
                </Text>
              </Box>
              <Badge size="sm" flex="none" variant="light" className="status-badge status-badge--info">{view.statusLabel}</Badge>
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
