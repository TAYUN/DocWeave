import { useEffect, useState } from 'react'
import { Button, Paper, Stack, TextInput, Textarea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { MutationNotice } from '@/features/shared/mutation-notice'
import { SectionHeading } from '@/features/shared/section-heading'
import { createDocument } from '@/lib/api'

export function CreateDocumentForm({
  spaceId,
  autoOpen,
  openSignal = 0,
  showTrigger = true,
}: {
  spaceId: string
  autoOpen: boolean
  openSignal?: number
  showTrigger?: boolean
}) {
  const queryClient = useQueryClient()
  const [opened, setOpened] = useState(autoOpen)
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (autoOpen) {
      setOpened(true)
    }
  }, [autoOpen])

  useEffect(() => {
    // 允许外层页面通过显式信号展开表单，保证摘要卡右上角入口和表单区域是同一条交互链路。
    if (openSignal > 0) {
      setOpened(true)
    }
  }, [openSignal])

  const createDocumentMutation = useMutation({
    mutationFn: createDocument,
    onSuccess: async () => {
      setTitle('')
      setSummary('')
      setError(null)
      setOpened(false)
      notifications.show({
        color: 'green',
        title: '创建文档',
        message: '文档创建成功。',
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['space-tree', spaceId] }),
      ])
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '创建文档失败，请稍后重试')
    },
  })

  if (!opened && showTrigger) {
    return (
      <Button onClick={() => setOpened(true)} variant="light">
        新建文档
      </Button>
    )
  }

  if (!opened) {
    return null
  }

  return (
    <Paper className="section-card" p={{ base: 'lg', md: 'xl' }} withBorder>
      <Stack
        component="form"
        gap="md"
        onSubmit={(event) => {
          event.preventDefault()
          setError(null)
          createDocumentMutation.mutate({ spaceId, title, summary })
        }}
      >
        <SectionHeading eyebrow="创建文档" title="在这个空间中新增文档" titleOrder={3} />
        <TextInput
          label="标题"
          onChange={(event) => setTitle(event.currentTarget.value)}
          placeholder="例如：新的产品文档"
          required
          value={title}
        />
        <Textarea
          autosize
          label="摘要"
          minRows={3}
          onChange={(event) => setSummary(event.currentTarget.value)}
          placeholder="简要说明这篇文档的目标和内容。"
          required
          value={summary}
        />
        <div className="action-row">
          <Button
            disabled={!title.trim() || !summary.trim()}
            loading={createDocumentMutation.isPending}
            type="submit"
          >
            {createDocumentMutation.isPending ? '创建中...' : '创建文档'}
          </Button>
          <Button onClick={() => setOpened(false)} variant="light">
            取消
          </Button>
        </div>
        <MutationNotice message={error} />
      </Stack>
    </Paper>
  )
}
