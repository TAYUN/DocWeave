import { ActionIcon, Alert, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { FilePlus, FolderOpen, MoreHorizontal } from 'lucide-react'
import { useAppShellData } from '../../features/shell/app-shell-data'
import { DocumentDirectoryList } from '../../features/documents/document-directory-list'
import { CreateDocumentForm } from '../../features/documents/create-document-form'
import {
  sortDocumentsByUpdatedAt,
  toSpaceSummaryViewModel,
} from '../../features/spaces/lib'
import { NotFoundStatePanel, RestrictedStatePanel } from '../../features/shared/state-panels'

function isRestrictedMessage(message: string) {
  return /权限|禁止|forbidden|restricted/i.test(message)
}

export function SpaceDetailPage({ spaceId }: { spaceId: string }) {
  const navigate = useNavigate()
  const { documents, documentsError, spaces } = useAppShellData()
  const [createDocumentOpenSignal, setCreateDocumentOpenSignal] = useState(0)
  const space = spaces.find((entry) => entry.id === spaceId) ?? null
  const spaceDocuments = documents.filter((entry) => entry.spaceId === spaceId)
  const spaceView = space ? toSpaceSummaryViewModel(space) : null

  if (!space) {
    return (
      <NotFoundStatePanel
        title="未找到对应空间"
        message="当前数据库中不存在你访问的这个空间。"
        onBack={() => navigate({ to: '/' })}
      />
    )
  }

  if (documentsError && isRestrictedMessage(documentsError.message)) {
    return (
      <RestrictedStatePanel
        title="你没有权限访问这个空间"
        message={documentsError.message}
        onBack={() => navigate({ to: '/' })}
      />
    )
  }

  return (
    <Container size={1040} px={{ base: 'md', md: 'lg' }} py={{ base: 'md', md: 'xl' }}>
      <Stack gap="xl">
        <Paper className="space-detail-hero" p={{ base: 'lg', md: 'xl' }} withBorder>
          <Group justify="space-between" align="flex-start" gap="lg">
            <Group gap="md" align="flex-start" wrap="nowrap">
              <div className="space-detail-icon">
                <FolderOpen size={28} />
              </div>
              <Stack gap="md" miw={0}>
                <div>
                  <Title order={1}>{spaceView?.name}</Title>
                  <Group gap="md" mt={10}>
                    <Text fw={600}>{spaceDocuments.length} 文档</Text>
                    <Text className="section-description">{spaceView?.rootDocumentCountText}</Text>
                  </Group>
                </div>
                <Text className="section-description" maw={720} size="md">
                  {spaceView?.detailSummaryText}
                </Text>
              </Stack>
            </Group>

            <Group gap="sm" flex="none">
              <Button
                leftSection={<FilePlus size={16} />}
                onClick={() => {
                  // 顶部主操作直接驱动下方表单展开，并滚动到落点，保证交互链路清晰。
                  setCreateDocumentOpenSignal((current) => current + 1)
                  const target = document.getElementById('create-document-form')
                  target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
              >
                新建文档
              </Button>
              <ActionIcon variant="light" color="gray" size={36} aria-label="更多操作">
                <MoreHorizontal size={18} />
              </ActionIcon>
            </Group>
          </Group>

          <Paper className="space-detail-note" p={{ base: 'md', md: 'lg' }} mt="xl" withBorder>
            <Text fw={700}>欢迎来到这个知识空间</Text>
            <Text className="section-description" mt={8}>
              知识空间像一本结构化的团队手册。你可以在这里持续补充文档，把零散的信息沉淀成可查找、可复用的知识。
            </Text>
          </Paper>
        </Paper>

        <div id="create-document-form">
          <CreateDocumentForm
            autoOpen={spaceDocuments.length === 0}
            openSignal={createDocumentOpenSignal}
            showTrigger={false}
            spaceId={spaceId}
          />
        </div>

        <Stack gap="md">
          <Group justify="space-between" align="end">
            <div>
              <Text fw={700}>文档目录</Text>
              <Text className="section-description" size="sm" mt={4}>
                这里列出这个空间中的全部文档，按最近更新时间排序，方便你像浏览目录一样进入内容。
              </Text>
            </div>
            <Text className="section-count">{spaceDocuments.length} 篇</Text>
          </Group>

          {documentsError && !isRestrictedMessage(documentsError.message) ? (
            <Alert className="status-alert status-alert--error" color="red" variant="light">
              加载文档列表失败：{documentsError.message}
            </Alert>
          ) : null}

          <DocumentDirectoryList
            documents={sortDocumentsByUpdatedAt(spaceDocuments)}
            emptyMessage="这个空间里还没有文档。"
            error={null}
            onOpenDocument={(documentId) =>
              navigate({ to: '/documents/$documentId', params: { documentId } })
            }
          />
        </Stack>
      </Stack>
    </Container>
  )
}
