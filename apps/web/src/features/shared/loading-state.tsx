import { Paper, Text } from '@mantine/core'
import { SectionHeading } from '@/features/shared/section-heading'

export function LoadingState({ label }: { label: string }) {
  return (
    <Paper className="section-card loading-panel" p="xl" withBorder>
      <SectionHeading eyebrow="加载中" title={label} />
      <Text className="muted" mt="md">
        工作台正在同步当前的产品数据，请稍候。
      </Text>
    </Paper>
  )
}
