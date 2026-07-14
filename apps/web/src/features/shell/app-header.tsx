import { ActionIcon, Avatar, Box, Group, Menu, Text, TextInput, Tooltip, UnstyledButton, useMantineColorScheme } from '@mantine/core'
import { useNavigate } from '@tanstack/react-router'
import { LogOut, Moon, Search, Settings, Sun } from 'lucide-react'
import { CreateSpaceModal } from '@/features/spaces/create-space-modal'
import type { CurrentUser } from '@/lib/api'

function getUserInitial(currentUser: CurrentUser | null) {
  if (!currentUser) return '…'
  const source = currentUser.fullName?.trim() || currentUser.email.trim()
  return source.slice(0, 1).toUpperCase()
}

export function AppHeader({
  currentUser,
  isLoggingOut,
  onLogout,
}: {
  currentUser: CurrentUser | null
  isLoggingOut: boolean
  onLogout: () => void
}) {
  const navigate = useNavigate()
  const { colorScheme, toggleColorScheme } = useMantineColorScheme()
  const isDark = colorScheme === 'dark'

  return (
    <Group h="100%" px="md" gap="md" wrap="nowrap">
      <Group gap="xs" wrap="nowrap" className="app-header-brand">
        <div
          className="brand-mark brand-mark--sm brand-mark--interactive"
          onClick={() => navigate({ to: '/' })}
        >
          <Text c="white" size="xs" fw={700}>DW</Text>
        </div>
        <Text fw={600} visibleFrom="sm">DocWeave</Text>
      </Group>

      <Box visibleFrom="md" className="app-header-search">
        <TextInput
          placeholder="搜索文档..."
          leftSection={<Search size={16} />}
          rightSection={<Text size="xs" c="dimmed">⌘K</Text>}
          readOnly
          onClick={() => navigate({ to: '/search' })}
          classNames={{ input: 'search-input' }}
          w="100%"
          maw={360}
          miw={220}
        />
      </Box>

      <Group gap={4} wrap="nowrap" className="app-header-actions">
        <CreateSpaceModal
          trigger={
            <Tooltip label="新建空间" position="bottom">
              <ActionIcon variant="subtle" color="gray">
                <Text className="plus-glyph" c="inherit">+</Text>
              </ActionIcon>
            </Tooltip>
          }
        />

        <Tooltip label={isDark ? '切换亮色模式' : '切换暗色模式'} position="bottom">
          <ActionIcon variant="subtle" color="gray" onClick={toggleColorScheme}>
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </ActionIcon>
        </Tooltip>

        <Menu shadow="md" width={200} position="bottom-end">
          <Menu.Target>
            <UnstyledButton>
              <Group gap="xs">
                <Avatar
                  radius="xl"
                  className="avatar-accent"
                >
                  {getUserInitial(currentUser)}
                </Avatar>
                <Text visibleFrom="lg">
                  {currentUser ? currentUser.fullName ?? currentUser.email : '加载中...'}
                </Text>
              </Group>
            </UnstyledButton>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Label>
              {currentUser ? `${currentUser.fullName ?? '用户'} · ${currentUser.email}` : '正在加载当前用户'}
            </Menu.Label>
            <Menu.Item leftSection={<Settings size={14} />} disabled>
              设置
            </Menu.Item>
            <Menu.Divider />
            <Menu.Item
              color="red"
              leftSection={<LogOut size={14} />}
              onClick={onLogout}
              disabled={isLoggingOut || !currentUser}
            >
              {isLoggingOut ? '退出中...' : '退出登录'}
            </Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>
    </Group>
  )
}
