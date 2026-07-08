import { Alert, Button, Group, Paper } from '@mantine/core'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { SectionHeading } from './section-heading'

export function ErrorStatePanel({
  title,
  message,
  onRetry,
}: {
  title: string
  message: string
  onRetry?: () => void
}) {
  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <SectionHeading eyebrow="发生错误" title={title} />
      <Alert className="status-alert status-alert--error" color="red" mt="lg" variant="light">
        {message}
      </Alert>
      {onRetry ? (
        <Button leftSection={<RefreshCw size={16} />} mt="lg" onClick={onRetry}>
          重试
        </Button>
      ) : null}
    </Paper>
  )
}

export function NotFoundStatePanel({
  title,
  message,
  onBack,
  backLabel = '返回工作台',
}: {
  title: string
  message: string
  onBack: () => void
  backLabel?: string
}) {
  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <SectionHeading eyebrow="未找到" title={title} description={message} />
      <Button leftSection={<ArrowLeft size={16} />} mt="lg" onClick={onBack} variant="light">
        {backLabel}
      </Button>
    </Paper>
  )
}

export function RestrictedStatePanel({
  title,
  message,
  onBack,
}: {
  title: string
  message: string
  onBack: () => void
}) {
  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <SectionHeading eyebrow="访问受限" title={title} />
      <Alert className="status-alert status-alert--error" color="red" mt="lg" variant="light">
        {message}
      </Alert>
      <Group mt="lg">
        <Button leftSection={<ArrowLeft size={16} />} onClick={onBack} variant="light">
          返回工作台
        </Button>
      </Group>
    </Paper>
  )
}
