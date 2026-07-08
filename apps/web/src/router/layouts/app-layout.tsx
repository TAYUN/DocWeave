import { Outlet, useNavigate } from '@tanstack/react-router'
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { AppShell, ScrollArea } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { clearAccessToken, hasAccessToken } from '../../lib/auth'
import { getCurrentUser, getSpaceTree, isAuthError, listDocuments, listSpaces, logout } from '../../lib/api'
import { AppHeader } from '../../features/shell/app-header'
import { AppSidebar } from '../../features/shell/app-sidebar'
import { AppShellDataProvider } from '../../features/shell/app-shell-data-provider'
import { ErrorStatePanel } from '../../features/shared/state-panels'
import { LoadingState } from '../../features/shared/loading-state'

export function AppLayout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const currentUserQuery = useQuery({
    queryKey: ['current-user'],
    queryFn: getCurrentUser,
    enabled: hasAccessToken(),
    retry: false,
  })

  const spacesQuery = useQuery({
    queryKey: ['spaces'],
    queryFn: listSpaces,
    enabled: currentUserQuery.isSuccess,
    retry: false,
  })

  const documentsQuery = useQuery({
    queryKey: ['documents'],
    queryFn: listDocuments,
    enabled: currentUserQuery.isSuccess,
    retry: false,
  })

  const treeQueries = useQueries({
    queries: (spacesQuery.data ?? []).map((space) => ({
      queryKey: ['space-tree', space.id],
      queryFn: () => getSpaceTree(space.id),
      enabled: currentUserQuery.isSuccess,
      retry: false,
    })),
  })

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSettled: async () => {
      clearAccessToken()
      queryClient.clear()
      notifications.show({
        color: 'blue',
        title: '已退出登录',
        message: '你已退出工作台。',
      })
      await navigate({ to: '/login' })
    },
  })

  const firstAuthError =
    currentUserQuery.error ??
    spacesQuery.error ??
    documentsQuery.error ??
    treeQueries.find((query) => query.error instanceof Error)?.error ??
    null

  if (!hasAccessToken()) {
    return <LoadingState label="正在跳转到登录页" />
  }

  if (firstAuthError && isAuthError(firstAuthError)) {
    clearAccessToken()
    queryClient.clear()
    void navigate({ to: '/login' })
    return <LoadingState label="登录态已失效，正在返回登录页" />
  }

  if (currentUserQuery.isPending || spacesQuery.isPending || documentsQuery.isPending || !currentUserQuery.data) {
    return <LoadingState label="正在加载工作台" />
  }

  if (currentUserQuery.isError || spacesQuery.isError) {
    return (
      <ErrorStatePanel
        title="无法加载已登录的工作台"
        message={(firstAuthError as Error | null)?.message ?? '当前用户上下文解析失败。'}
        onRetry={() => {
          void currentUserQuery.refetch()
          void spacesQuery.refetch()
        }}
      />
    )
  }

  const treeEntries = (spacesQuery.data ?? []).map((space, index) => ({
    space,
    tree: treeQueries[index]?.data ?? null,
    isPending: treeQueries[index]?.isPending ?? false,
    error: treeQueries[index]?.error instanceof Error ? treeQueries[index].error : null,
  }))

  return (
    <AppShellDataProvider
      value={{
        currentUser: currentUserQuery.data,
        documents: documentsQuery.data ?? [],
        documentsError: documentsQuery.error instanceof Error ? documentsQuery.error : null,
        documentsPending: documentsQuery.isPending,
        spaces: spacesQuery.data ?? [],
        treeEntries,
      }}
    >
      <AppShell
        header={{ height: 48 }}
        navbar={{ width: 240, breakpoint: 'sm' }}
        padding={0}
      >
        <AppShell.Header>
          <AppHeader
            currentUser={currentUserQuery.data}
            isLoggingOut={logoutMutation.isPending}
            onLogout={() => logoutMutation.mutate()}
          />
        </AppShell.Header>

        <AppShell.Navbar className="app-shell-navbar">
          <AppShell.Section grow component={ScrollArea}>
            <AppSidebar treeEntries={treeEntries} />
          </AppShell.Section>
        </AppShell.Navbar>

        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
    </AppShellDataProvider>
  )
}
