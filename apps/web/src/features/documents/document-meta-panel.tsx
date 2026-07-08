import { Button, Paper, Stack, Text } from '@mantine/core'
import { SectionHeading } from '@/features/shared/section-heading'

export function DocumentMetaPanel({
  documentId,
  spaceId,
  updatedAt,
  onBackToSpace,
}: {
  documentId: string
  spaceId: string
  updatedAt: string | null
  onBackToSpace: () => void
}) {
  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <SectionHeading eyebrow="元数据" title="当前文档上下文" titleOrder={3} />
      <Stack gap="md" mt="lg">
        <Paper className="detail-item-card" p={{ base: 'sm', md: 'md' }} withBorder>
          <Text fw={700}>文档 ID</Text>
          <Text className="muted" mt={4} size="sm">
            {documentId}
          </Text>
        </Paper>
        <Paper className="detail-item-card" p={{ base: 'sm', md: 'md' }} withBorder>
          <Text fw={700}>所属空间</Text>
          <Text className="muted" mt={4} size="sm">
            {spaceId}
          </Text>
        </Paper>
        <Paper className="detail-item-card" p={{ base: 'sm', md: 'md' }} withBorder>
          <Text fw={700}>最后更新</Text>
          <Text className="muted" mt={4} size="sm">
            {updatedAt ?? '暂无更新时间'}
          </Text>
        </Paper>
      </Stack>
      <Button mt="lg" onClick={onBackToSpace} variant="light">
        返回所属空间
      </Button>
    </Paper>
  )
}
