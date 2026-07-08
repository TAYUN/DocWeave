import { Badge, Box, Group, Paper, Stack, Text } from '@mantine/core'
import type { ApiSpace } from '../../lib/api'

export function SpaceList({
  spaces,
  onOpenSpace,
}: {
  spaces: ApiSpace[]
  onOpenSpace: (spaceId: string) => void
}) {
  return (
    <Stack gap="md">
      {spaces.map((space) => (
        <Paper
          className="list-button"
          component="button"
          key={space.id}
          p="md"
          withBorder
          onClick={() => onOpenSpace(space.id)}
        >
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box flex={1} miw={0}>
              <Text fw={700}>{space.name}</Text>
              <Text className="muted" mt={4} size="sm" lineClamp={2}>
                {space.summary}
              </Text>
            </Box>
            <Badge size="sm" flex="none" variant="light" className="status-badge status-badge--info">
              {space.rootDocuments.length} 篇文档
            </Badge>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}
