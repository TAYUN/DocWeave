import { Alert, Group, Paper, Stack, Text } from '@mantine/core'
import { Clock3, FileText } from 'lucide-react'
import type { ApiDocumentSummary } from '@/lib/api'
import {
  formatDocumentUpdatedAt,
  toDocumentPreviewViewModel,
} from '@/features/documents/lib/document-display'

export function DocumentDirectoryList({
  documents,
  emptyMessage,
  error,
  onOpenDocument,
}: {
  documents: ApiDocumentSummary[]
  emptyMessage: string
  error: Error | null
  onOpenDocument: (documentId: string) => void
}) {
  if (error) {
    return (
      <Alert className="status-alert status-alert--error" color="red" variant="light">
        {error.message}
      </Alert>
    )
  }

  if (documents.length === 0) {
    return (
      <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
        <Text fw={700}>还没有文档</Text>
        <Text className="section-description" mt={4} size="sm">
          {emptyMessage}
        </Text>
      </Paper>
    )
  }

  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <Stack gap={6}>
        {documents.map((document) => {
          const view = toDocumentPreviewViewModel(document)

          return (
            <button
              key={view.id}
              type="button"
              className="directory-row-button"
              onClick={() => onOpenDocument(view.id)}
            >
              <Group justify="space-between" align="center" gap="md" wrap="nowrap">
                <Group gap="sm" wrap="nowrap" miw={0}>
                  <div className="directory-row-icon">
                    <FileText size={15} />
                  </div>
                  <Stack gap={2} miw={0}>
                    <Text fw={500} truncate>
                      {view.title}
                    </Text>
                    <Text className="section-description" size="xs" lineClamp={1}>
                      {view.summaryText}
                    </Text>
                  </Stack>
                </Group>

                <Group gap={6} wrap="nowrap" flex="none" className="directory-row-meta">
                  <Clock3 size={13} />
                  <Text size="xs">
                    {formatDocumentUpdatedAt(document.updatedAt).replace('更新于 ', '')}
                  </Text>
                </Group>
              </Group>
            </button>
          )
        })}
      </Stack>
    </Paper>
  )
}
