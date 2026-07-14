import { Alert, Button, Container, Group, Paper, Select, Stack, Text, Textarea, Title } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import type { RagStreamEvent } from '@docweave/contracts/rag'
import { RagCitations } from '@/features/rag/rag-citations'
import { getRagFailedIndexMessage, getRagIndexState, toRagChatViewModel } from '@/features/rag/lib'
import { useAppShellData } from '@/features/shell/app-shell-data'
import { getDocumentProcessingStatus, streamRagChat } from '@/lib/api'

export function ChatPage() {
  const { documents, documentsError, documentsPending, spaces } = useAppShellData()
  const [message, setMessage] = useState('')
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [events, setEvents] = useState<RagStreamEvent[]>([])
  const [status, setStatus] = useState<'idle' | 'streaming' | 'completed' | 'cancelled' | 'failed'>('idle')
  const [error, setError] = useState<unknown>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const scopedDocuments = documents.filter((document) => !spaceId || document.spaceId === spaceId)
  const statusesQuery = useQuery({
    queryKey: ['document-processing-statuses', scopedDocuments.map((document) => document.id)],
    queryFn: () => Promise.all(scopedDocuments.map((document) => getDocumentProcessingStatus(document.id))),
    enabled: !documentsPending && !documentsError,
    refetchInterval: (query) =>
      query.state.data?.some((status) => status.latestIndexJob?.status === 'pending' || status.latestIndexJob?.status === 'running')
        ? 3000
        : false,
  })
  const indexState = getRagIndexState(documents, {
    spaceId,
    pending: documentsPending,
    error: documentsError,
    statuses: statusesQuery.data,
    statusesPending: statusesQuery.isPending,
    statusesError: statusesQuery.error,
  })
  const failedIndexError = new Error(getRagFailedIndexMessage(statusesQuery.data ?? []))

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  const view = status === 'failed'
    ? toRagChatViewModel({ status: 'failed', events, error })
    : status === 'cancelled'
      ? toRagChatViewModel({ status: 'cancelled', events })
    : status === 'streaming' || status === 'completed'
        ? toRagChatViewModel({ status: 'streaming', events })
        : toRagChatViewModel({ status: 'idle' })
  const displayView = status === 'streaming'
    ? view
    : indexState === 'loading'
      ? toRagChatViewModel({ status: 'index-loading', events })
      : indexState === 'failed'
        ? toRagChatViewModel({ status: 'index-failed', events, error: documentsError })
        : indexState === 'failed-index'
          ? toRagChatViewModel({ status: 'index-failed', events, error: failedIndexError })
        : indexState === 'no-index'
          ? toRagChatViewModel({ status: 'no-index', events })
          : view

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const text = message.trim()
    if (!text || status === 'streaming') return
    const controller = new AbortController()
    abortControllerRef.current = controller
    setEvents([])
    setError(null)
    setStatus('streaming')
    let terminalEventReceived = false
    let terminalErrorReceived = false
    try {
      await streamRagChat(
        { message: text, ...(spaceId ? { spaceId } : {}) },
        {
          signal: controller.signal,
          onEvent: (streamEvent) => {
            terminalEventReceived = streamEvent.type === 'finish' || streamEvent.type === 'error'
            terminalErrorReceived = streamEvent.type === 'error'
            setEvents((current) => [...current, streamEvent])
          },
        },
      )
      if (!terminalEventReceived) {
        setError(new Error('知识问答流在完成前中断，请重新提问。'))
        setStatus('failed')
      } else if (terminalErrorReceived) {
        setStatus('failed')
      } else {
        setStatus('completed')
      }
    } catch (streamError) {
      if (controller.signal.aborted) {
        setStatus('cancelled')
      } else {
        setError(streamError)
        setStatus('failed')
      }
    } finally {
      if (abortControllerRef.current === controller) abortControllerRef.current = null
    }
  }

  return (
    <Container size={900} px={{ base: 'md', md: 'lg' }} py={{ base: 'md', md: 'xl' }}>
      <Stack gap="lg">
        <div><Title order={1}>知识问答</Title><Text c="dimmed" mt={4}>本次回答仅保留在当前页面，不会保存为对话历史。</Text></div>
        <Paper withBorder p="md" radius="sm">
          <form onSubmit={submit}>
            <Stack gap="sm">
              <Textarea label="问题" value={message} onChange={(event) => setMessage(event.currentTarget.value)} minRows={3} placeholder="输入一个关于知识库的问题" disabled={status === 'streaming'} />
              <Group justify="space-between" align="end">
                <Select label="空间" placeholder="全部可见空间" clearable data={spaces.map((space) => ({ value: space.id, label: space.name }))} value={spaceId} onChange={setSpaceId} disabled={status === 'streaming'} w={{ base: '100%', sm: 260 }} />
                {status === 'streaming' ? <Button color="red" variant="light" onClick={() => abortControllerRef.current?.abort()}>停止生成</Button> : <Button type="submit" disabled={!message.trim() || indexState !== 'ready'}>开始问答</Button>}
              </Group>
            </Stack>
          </form>
        </Paper>

        {displayView.state === 'idle' ? <Text c="dimmed">输入问题后开始本轮问答。</Text> : null}
        {displayView.state === 'index-loading' ? <Alert color="blue" title="正在加载文档索引状态">索引状态加载完成后即可开始问答。</Alert> : null}
        {displayView.state === 'index-failed' ? <Alert color="red" title={indexState === 'failed-index' ? '文档索引失败' : '无法确认文档索引状态'}>{displayView.errorMessage}</Alert> : null}
        {displayView.state === 'no-index' ? <Alert color="yellow" title="当前范围尚未建立索引">完成文档索引后即可进行问答。</Alert> : null}
        {displayView.state === 'restricted' ? <Alert color="red" title="问答范围受限">{displayView.errorMessage}</Alert> : null}
        {displayView.state === 'failed' ? <Alert color="red" title="问答失败">{displayView.errorMessage}</Alert> : null}
        {displayView.state === 'cancelled' ? <Alert color="gray" title="已停止生成">已保留本次已生成的内容和来源。</Alert> : null}
        {displayView.state !== 'restricted' && (displayView.answer || displayView.state === 'streaming' || displayView.state === 'completed' || displayView.state === 'cancelled') ? (
          <Paper withBorder p="md" radius="sm">
            <Stack gap="md">
              <div><Text fw={600} mb="xs">回答</Text><Text aria-live="polite" style={{ overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' }}>{displayView.answer || '正在生成回答...'}</Text></div>
              <div><Text fw={600} mb="xs">来源</Text><RagCitations citations={displayView.citations} /></div>
            </Stack>
          </Paper>
        ) : null}
      </Stack>
    </Container>
  )
}
