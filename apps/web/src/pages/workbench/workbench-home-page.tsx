import { Badge, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { FolderOpen, Sparkles } from 'lucide-react'
import { useAppShellData } from '../../features/shell/app-shell-data'
import { CreateSpaceModal } from '../../features/spaces/create-space-modal'
import { SpaceOverviewGrid } from '../../features/spaces/space-overview-grid'

export function WorkbenchHomePage() {
  const navigate = useNavigate()
  const { currentUser, documents, documentsError, documentsPending, spaces } = useAppShellData()
  const commonSpaces = spaces.slice(0, 3)

  return (
    <Container size={1040} px={{ base: 'md', md: 'lg' }} py={{ base: 'md', md: 'xl' }}>
      <Stack gap="xl">
        <Paper className="space-home-hero" p={{ base: 'lg', md: 'xl' }} withBorder>
          <Group justify="space-between" align="flex-start" gap="xl">
            <Stack gap="md" maw={680}>
              <Badge
                size="sm"
                variant="light"
                leftSection={<Sparkles size={12} />}
                className="status-badge status-badge--info"
              >
                Knowledge Spaces
              </Badge>
              <div>
                <Title order={1} mb={6}>知识空间</Title>
                <Text className="section-description" size="md">
                  {currentUser.fullName ?? '你'} 的文档、专题和知识沉淀都从这里展开。先进入一个空间，再继续查看和编辑其中的文档。
                </Text>
              </div>
              <Group gap="sm">
                <CreateSpaceModal buttonLabel="新建知识空间" primary />
                <Button
                  variant="light"
                  onClick={() => commonSpaces[0] && navigate({ to: '/spaces/$spaceId', params: { spaceId: commonSpaces[0].id } })}
                  disabled={commonSpaces.length === 0}
                >
                  打开常用空间
                </Button>
              </Group>
            </Stack>

            <Group gap="md" className="space-home-metrics">
              <div className="space-home-metric">
                <Text className="space-home-metric-value">{spaces.length}</Text>
                <Text className="section-count">知识空间</Text>
              </div>
              <div className="space-home-metric">
                <Text className="space-home-metric-value">{documents.length}</Text>
                <Text className="section-count">总文档数</Text>
              </div>
            </Group>
          </Group>
        </Paper>

        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={700}>常用空间</Text>
              <Text className="section-description" size="sm" mt={4}>
                把最近最常进入的知识空间放在最前面，方便你快速回到上下文。
              </Text>
            </div>
            <Group gap="xs">
              <FolderOpen size={16} color="var(--mantine-color-dimmed)" />
              <Text className="section-count">{commonSpaces.length} 个</Text>
            </Group>
          </Group>

          <SpaceOverviewGrid
            spaces={commonSpaces}
            documents={documents}
            emptyTitle="还没有常用空间"
            emptyMessage="先创建一个知识空间，后续这里会优先显示你最常进入的内容。"
            onOpenSpace={(spaceId) => navigate({ to: '/spaces/$spaceId', params: { spaceId } })}
            onOpenDocument={(documentId) => navigate({ to: '/documents/$documentId', params: { documentId } })}
          />
        </Stack>

        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={700}>我的空间</Text>
              <Text className="section-description" size="sm" mt={4}>
                每个空间下会带出最近更新的文档，让你不用先进入空间也能快速判断下一步去哪。
              </Text>
            </div>
            <Text className="section-count">{documentsPending || documentsError ? '同步中' : `${spaces.length} 个空间`}</Text>
          </Group>

          <SpaceOverviewGrid
            spaces={spaces}
            documents={documents}
            emptyTitle="还没有知识空间"
            emptyMessage="创建第一个知识空间，把团队文档和专题内容整理起来。"
            onOpenSpace={(spaceId) => navigate({ to: '/spaces/$spaceId', params: { spaceId } })}
            onOpenDocument={(documentId) => navigate({ to: '/documents/$documentId', params: { documentId } })}
          />
        </Stack>
      </Stack>
    </Container>
  )
}
