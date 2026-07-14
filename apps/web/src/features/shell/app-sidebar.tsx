import { Box, Divider, Group, Loader, NavLink, Stack, Text } from '@mantine/core'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { FileText, MessageCircle, Search } from 'lucide-react'
import { useAppShellData, type AppShellTreeEntry } from './app-shell-data'
import classes from './AppSidebar.module.css'

function getSidebarMode(pathname: string) {
  if (pathname.startsWith('/documents/')) return 'DocumentMode'
  if (pathname.startsWith('/spaces/')) return 'SpaceMode'
  return 'GlobalMode'
}

export function AppSidebar({ treeEntries }: { treeEntries: AppShellTreeEntry[] }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { documents, documentsPending, spaces } = useAppShellData()
  const sidebarMode = getSidebarMode(location.pathname)
  const currentSpaceId = location.pathname.match(/^\/spaces\/([^/]+)/)?.[1] ?? null
  const currentDocumentId = location.pathname.match(/^\/documents\/([^/]+)/)?.[1] ?? null
  const activeTreeEntry =
    treeEntries.find(({ space }) => space.id === currentSpaceId) ??
    treeEntries.find(({ tree }) => tree?.children.some((doc) => doc.id === currentDocumentId)) ??
    null

  return (
    <Stack gap={0} h="100%">
      <Box px="xs" py={6} className="sidebar-topbar">
        <NavLink
          label="工作台"
          active={location.pathname === '/'}
          onClick={() => navigate({ to: '/' })}
          className={`ui-interactive ${classes.navLink} ${classes.primaryNavLink}`}
        />
      </Box>

      <Box p="xs">
        <NavLink
          label="搜索知识库"
          leftSection={<Search size={14} />}
          active={location.pathname === '/search'}
          onClick={() => navigate({ to: '/search' })}
          className={`ui-interactive ${classes.navLink}`}
        />
        <NavLink
          label="知识问答"
          leftSection={<MessageCircle size={14} />}
          active={location.pathname === '/chat'}
          onClick={() => navigate({ to: '/chat' })}
          className={`ui-interactive ${classes.navLink}`}
        />
        <Divider my={4} />
        <Group justify="space-between" px="xs" py={6}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase">
            空间
          </Text>
          <Text size="xs" c="dimmed">{spaces.length}</Text>
        </Group>

        {spaces.length === 0 ? (
          <Text size="xs" c="dimmed" px="xs">还没有空间</Text>
        ) : (
          spaces.map((space) => (
            <NavLink
              key={space.id}
              label={space.name}
              active={space.id === currentSpaceId}
              onClick={() => navigate({ to: '/spaces/$spaceId', params: { spaceId: space.id } })}
              className={`ui-interactive ${classes.navLink}`}
              childrenOffset={12}
              defaultOpened={sidebarMode !== 'GlobalMode' && space.id === currentSpaceId}
            >
              {sidebarMode !== 'GlobalMode' && activeTreeEntry && activeTreeEntry.space.id === space.id ? (
                <>
                  {activeTreeEntry.isPending ? (
                    <Group gap="xs" px="xs" py={4}>
                      <Loader size="xs" />
                      <Text size="xs" c="dimmed">加载文档树...</Text>
                    </Group>
                  ) : activeTreeEntry.error ? (
                    <Text size="xs" c="red" px="xs">加载失败</Text>
                  ) : activeTreeEntry.tree && activeTreeEntry.tree.children.length > 0 ? (
                    activeTreeEntry.tree.children.map((doc) => (
                      <NavLink
                        key={doc.id}
                        label={doc.title}
                        leftSection={<FileText size={14} />}
                        active={doc.id === currentDocumentId}
                        onClick={() =>
                          navigate({ to: '/documents/$documentId', params: { documentId: doc.id } })
                        }
                        className={`ui-interactive ${classes.navLink}`}
                      />
                    ))
                  ) : (
                    <Text size="xs" c="dimmed" px="xs">还没有文档</Text>
                  )}
                </>
              ) : null}
            </NavLink>
          ))
        )}

        {sidebarMode === 'GlobalMode' ? (
          <>
            <Divider my={4} />
            <Group justify="space-between" px="xs" py={6}>
              <Text size="xs" c="dimmed" fw={600} tt="uppercase">
                最近文档
              </Text>
              <Text size="xs" c="dimmed">{documents.length}</Text>
            </Group>

            {documentsPending ? (
              <Group gap="xs" px="xs" py={4}>
                <Loader size="xs" />
                <Text size="xs" c="dimmed">加载中...</Text>
              </Group>
            ) : documents.length === 0 ? (
              <Text size="xs" c="dimmed" px="xs">还没有文档</Text>
            ) : (
              documents.slice(0, 8).map((doc) => (
                <NavLink
                  key={doc.id}
                  label={doc.title}
                  leftSection={<FileText size={14} />}
                  onClick={() =>
                    navigate({ to: '/documents/$documentId', params: { documentId: doc.id } })
                  }
                  className={`ui-interactive ${classes.navLink}`}
                />
              ))
            )}
          </>
        ) : null}
      </Box>
    </Stack>
  )
}
