import type { ReactNode } from 'react'
import { useState } from 'react'
import { Box, Button, Modal, Stack, Text, TextInput, Textarea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createSpace } from '../../lib/api'
import { MutationNotice } from '../shared/mutation-notice'

export function CreateSpaceModal({
  buttonLabel = '新建空间',
  primary = false,
  trigger,
}: {
  buttonLabel?: ReactNode
  primary?: boolean
  trigger?: ReactNode
}) {
  const queryClient = useQueryClient()
  const [opened, setOpened] = useState(false)
  const [name, setName] = useState('')
  const [summary, setSummary] = useState('')
  const [error, setError] = useState<string | null>(null)

  const createSpaceMutation = useMutation({
    mutationFn: createSpace,
    onSuccess: async () => {
      setName('')
      setSummary('')
      setError(null)
      setOpened(false)
      notifications.show({
        color: 'green',
        title: '创建空间',
        message: '空间创建成功。',
      })
      await queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : '创建空间失败，请稍后重试')
    },
  })

  return (
    <>
      {trigger ? (
        <Box className="trigger-clickable" onClick={() => setOpened(true)}>
          {trigger}
        </Box>
      ) : (
        <Button onClick={() => setOpened(true)} variant={primary ? 'filled' : 'light'}>
          {buttonLabel}
        </Button>
      )}

      <Modal onClose={() => setOpened(false)} opened={opened} title="创建空间">
        <Stack
          component="form"
          gap="md"
          onSubmit={(event) => {
            event.preventDefault()
            setError(null)
            createSpaceMutation.mutate({ name, summary })
          }}
        >
          <Text size="sm">创建一个工作空间，作为文档和项目上下文的承载容器。</Text>
          <TextInput
            label="名称"
            onChange={(event) => setName(event.currentTarget.value)}
            placeholder="例如：研究工作区"
            required
            value={name}
          />
          <Textarea
            autosize
            label="简介"
            minRows={3}
            onChange={(event) => setSummary(event.currentTarget.value)}
            placeholder="填写这个空间的用途、阶段目标和后续动作。"
            required
            value={summary}
          />
          <Button
            disabled={!name.trim() || !summary.trim()}
            loading={createSpaceMutation.isPending}
            type="submit"
          >
            {createSpaceMutation.isPending ? '创建中...' : '创建空间'}
          </Button>
          <MutationNotice message={error} />
        </Stack>
      </Modal>
    </>
  )
}
