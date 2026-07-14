import { Alert, Button, Container, Group, Loader, Paper, Select, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'
import { useState } from 'react'
import { CitationLink } from '@/features/rag/citation-link'
import { getRagFailedIndexMessage, getRagIndexState, toRagSearchViewModel } from '@/features/rag/lib'
import { useAppShellData } from '@/features/shell/app-shell-data'
import { getDocumentProcessingStatus, searchRag } from '@/lib/api'

export function SearchPage() {
  const { documents, documentsError, documentsPending, spaces } = useAppShellData()
  const [searchText, setSearchText] = useState('')
  const [spaceId, setSpaceId] = useState<string | null>(null)
  const [submittedSearchText, setSubmittedSearchText] = useState('')
  const searchMutation = useMutation({ mutationFn: searchRag })
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
  const view = indexState === 'loading'
    ? toRagSearchViewModel({ status: 'index-loading', searchText: submittedSearchText })
    : indexState === 'failed'
      ? toRagSearchViewModel({ status: 'index-failed', searchText: submittedSearchText, error: documentsError })
      : indexState === 'failed-index'
        ? toRagSearchViewModel({ status: 'index-failed', searchText: submittedSearchText, error: failedIndexError })
      : indexState === 'no-index'
        ? toRagSearchViewModel({ status: 'no-index', searchText: submittedSearchText })
    : searchMutation.isPending
    ? toRagSearchViewModel({ status: 'loading', searchText: submittedSearchText })
    : searchMutation.isError
      ? toRagSearchViewModel({ status: 'failed', searchText: submittedSearchText, error: searchMutation.error })
      : searchMutation.data
        ? indexState === 'ready'
          ? toRagSearchViewModel({ status: 'success', response: searchMutation.data })
          : toRagSearchViewModel({ status: 'no-index', searchText: submittedSearchText })
        : toRagSearchViewModel({ status: 'idle' })

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const value = searchText.trim()
    if (!value) return
    setSubmittedSearchText(value)
    if (indexState !== 'ready') {
      return
    }
    searchMutation.mutate({ searchText: value, ...(spaceId ? { spaceId } : {}) })
  }

  return (
    <Container size={900} px={{ base: 'md', md: 'lg' }} py={{ base: 'md', md: 'xl' }}>
      <Stack gap="lg">
        <div>
          <Title order={1}>搜索知识库</Title>
          <Text c="dimmed" mt={4}>按已建立索引的文档片段查找内容。</Text>
        </div>

        <Paper withBorder p="md" radius="sm">
          <form onSubmit={submit}>
            <Group align="end">
              <TextInput
                label="搜索内容"
                value={searchText}
                onChange={(event) => setSearchText(event.currentTarget.value)}
                placeholder="输入关键词或问题"
                leftSection={<Search size={16} />}
                disabled={searchMutation.isPending || indexState !== 'ready'}
                flex={1}
              />
              <Select
                label="空间"
                placeholder="全部可见空间"
                clearable
                data={spaces.map((space) => ({ value: space.id, label: space.name }))}
                value={spaceId}
                onChange={setSpaceId}
                disabled={searchMutation.isPending || indexState !== 'ready'}
                w={{ base: '100%', sm: 220 }}
              />
              <Button type="submit" loading={searchMutation.isPending} disabled={!searchText.trim() || indexState !== 'ready'}>
                搜索
              </Button>
            </Group>
          </form>
        </Paper>

        {view.state === 'idle' ? <Text c="dimmed">输入内容后开始搜索。</Text> : null}
        {view.state === 'loading' ? <Group><Loader size="sm" /><Text>正在搜索“{view.searchText}”...</Text></Group> : null}
        {view.state === 'index-loading' ? <Group><Loader size="sm" /><Text>正在加载文档索引状态...</Text></Group> : null}
        {view.state === 'index-failed' ? <Alert color="red" title={indexState === 'failed-index' ? '文档索引失败' : '无法确认文档索引状态'}>{view.errorMessage}</Alert> : null}
        {view.state === 'no-index' ? <Alert color="yellow" title="当前范围尚未建立索引">请先为文档创建稳定快照并完成索引，再进行搜索。</Alert> : null}
        {view.state === 'restricted' ? <Alert color="red" title="搜索范围受限">{view.errorMessage}</Alert> : null}
        {view.state === 'failed' ? <Alert color="red" title="搜索失败">{view.errorMessage}</Alert> : null}
        {view.state === 'empty' ? <Alert color="gray" title="没有匹配结果">尝试调整关键词或选择其他可访问的空间。</Alert> : null}
        {view.state === 'results' ? (
          <Stack gap="sm">
            <Text size="sm" c="dimmed">“{view.searchText}”共找到 {view.hits.length} 条片段</Text>
            {view.hits.map((hit) => (
              <Paper key={hit.citation.id} withBorder p="md" radius="sm">
                <Stack gap="xs">
                  <Text size="sm">{hit.snippet}</Text>
                  <CitationLink citation={hit.citation} label="打开文档位置" />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : null}
      </Stack>
    </Container>
  )
}
