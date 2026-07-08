import { Badge, Group, Paper, Text } from '@mantine/core'

export function DocumentStatusBar({
  statusLabel,
  hasUnsavedChanges,
}: {
  statusLabel: string
  hasUnsavedChanges: boolean
}) {
  return (
    <Paper className="section-card" p="md" withBorder>
      <Group justify="space-between">
        <Badge size="sm" variant="light" className="status-badge status-badge--info">
          {statusLabel}
        </Badge>
        {hasUnsavedChanges ? (
          <Text className="status-text--warning" fw={600} size="sm">
            有未保存的修改
          </Text>
        ) : (
          <Text className="muted" size="sm">
            当前内容已与最近一次保存对齐
          </Text>
        )}
      </Group>
    </Paper>
  )
}
