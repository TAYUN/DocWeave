import { Badge, Box, Group, Paper, Stack, Text } from '@mantine/core'
import type { ApiSpace } from '../../lib/api'
import { toSpaceSummaryViewModel } from './lib'

export function SpaceList({
  spaces,
  onOpenSpace,
}: {
  spaces: ApiSpace[]
  onOpenSpace: (spaceId: string) => void
}) {
  return (
    <Stack gap="md">
      {spaces.map((space) => {
        const view = toSpaceSummaryViewModel(space)

        return (
          <Paper
            className="list-button"
            component="button"
            key={view.id}
            p="md"
            withBorder
            onClick={() => onOpenSpace(view.id)}
          >
            <Group justify="space-between" align="flex-start" wrap="nowrap">
              <Box flex={1} miw={0}>
                <Text fw={700}>{view.name}</Text>
                <Text className="muted" mt={4} size="sm" lineClamp={2}>
                  {view.summaryText}
                </Text>
              </Box>
              <Badge size="sm" flex="none" variant="light" className="status-badge status-badge--info">
                {view.documentCountText}
              </Badge>
            </Group>
          </Paper>
        )
      })}
    </Stack>
  )
}
