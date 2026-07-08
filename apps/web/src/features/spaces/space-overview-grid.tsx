import { ActionIcon, Badge, Button, Group, Paper, SimpleGrid, Stack, Text } from '@mantine/core'
import { ArrowRight, BookOpenText, FolderOpen } from 'lucide-react'
import type { ApiDocumentSummary, ApiSpace } from '@/lib/api'
import {
  formatDocumentUpdatedAtShort,
  pickRecentSpaceDocuments,
  toSpaceSummaryViewModel,
} from '@/features/spaces/lib'

export function SpaceOverviewGrid({
  spaces,
  documents,
  emptyTitle,
  emptyMessage,
  onOpenSpace,
  onOpenDocument,
}: {
  spaces: ApiSpace[]
  documents: ApiDocumentSummary[]
  emptyTitle: string
  emptyMessage: string
  onOpenSpace: (spaceId: string) => void
  onOpenDocument: (documentId: string) => void
}) {
  if (spaces.length === 0) {
    return (
      <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
        <Text fw={700}>{emptyTitle}</Text>
        <Text className="section-description" mt={4} size="sm">
          {emptyMessage}
        </Text>
      </Paper>
    )
  }

  return (
    <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="md" verticalSpacing="md">
      {spaces.map((space) => {
        const view = toSpaceSummaryViewModel(space)
        const relatedDocuments = pickRecentSpaceDocuments(space.id, documents)

        return (
          <Paper key={view.id} className="space-overview-card" p={{ base: 'lg', md: 'xl' }} withBorder>
            <Stack gap="lg">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <Group gap="md" wrap="nowrap" align="flex-start">
                  <div className="space-overview-icon">
                    <FolderOpen size={18} />
                  </div>
                  <Stack gap={4} miw={0}>
                    <Group gap="xs" wrap="wrap">
                      <Text fw={700} size="lg" truncate>
                        {view.name}
                      </Text>
                      <Badge size="sm" variant="light" className="status-badge status-badge--info">
                        {view.documentCountText}
                      </Badge>
                    </Group>
                    <Text className="section-description" size="sm" lineClamp={2}>
                      {view.summaryText}
                    </Text>
                  </Stack>
                </Group>

                <ActionIcon
                  variant="subtle"
                  color="gray"
                  onClick={() => onOpenSpace(view.id)}
                  aria-label={`打开空间 ${view.name}`}
                >
                  <ArrowRight size={16} />
                </ActionIcon>
              </Group>

              <Stack gap="xs">
                <Group justify="space-between" align="center">
                  <Text className="section-eyebrow">最近文档</Text>
                  <Button variant="subtle" size="compact-sm" onClick={() => onOpenSpace(view.id)}>
                    进入空间
                  </Button>
                </Group>

                {relatedDocuments.length > 0 ? (
                  <Stack gap={6}>
                    {relatedDocuments.map((document) => (
                      <button
                        key={document.id}
                        type="button"
                        className="space-overview-doc-button"
                        onClick={() => onOpenDocument(document.id)}
                      >
                        <Group justify="space-between" wrap="nowrap" gap="sm">
                          <Group gap="xs" wrap="nowrap" miw={0}>
                            <BookOpenText size={14} color="var(--mantine-color-dimmed)" />
                            <Text size="sm" truncate>
                              {document.title}
                            </Text>
                          </Group>
                          <Text className="section-count" flex="none">
                            {formatDocumentUpdatedAtShort(document.updatedAt)}
                          </Text>
                        </Group>
                      </button>
                    ))}
                  </Stack>
                ) : (
                  <Paper className="space-overview-empty" p="md" withBorder>
                    <Text fw={600} size="sm">
                      还没有文档
                    </Text>
                    <Text className="section-description" mt={4} size="xs">
                      进入这个空间后，可以创建第一篇文档开始积累内容。
                    </Text>
                  </Paper>
                )}
              </Stack>
            </Stack>
          </Paper>
        )
      })}
    </SimpleGrid>
  )
}
