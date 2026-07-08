import { useState } from 'react'
import { Alert, Box, Button, Group, Paper, PasswordInput, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { notifications } from '@mantine/notifications'
import { useQueryClient, useMutation } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { AlertCircle, BookOpen, Lock, Share2, Sparkles } from 'lucide-react'
import { saveAccessToken } from '@/lib/auth'
import { AuthError, login } from '@/lib/api'

function getLoginErrorMessage(error: unknown) {
  if (error instanceof AuthError) return '邮箱或密码不正确'
  if (error instanceof TypeError) return '无法连接到服务器，请检查网络'
  return error instanceof Error ? error.message : '登录失败，请稍后重试'
}

const features = [
  { icon: Share2, label: '实时协同', desc: '多人同时编辑同一篇文档，变更实时同步' },
  { icon: Sparkles, label: 'AI 问答', desc: '基于团队知识库的 RAG 检索，即时获取答案' },
  { icon: BookOpen, label: '三层结构', desc: '空间 → 文档 → 文档树，清晰组织团队知识' },
  { icon: Lock, label: '权限管理', desc: '空间级和文档级访问控制，保障信息安全' },
]

export function LoginPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [email, setEmail] = useState('owner@docweave.dev')
  const [password, setPassword] = useState('docweave123')
  const [error, setError] = useState<string | null>(null)

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (payload) => {
      saveAccessToken(payload.token)
      setError(null)
      notifications.show({ color: 'green', title: '登录成功', message: '工作台已就绪。' })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['current-user'] }),
        queryClient.invalidateQueries({ queryKey: ['spaces'] }),
        queryClient.invalidateQueries({ queryKey: ['documents'] }),
      ])
      await navigate({ to: '/' })
    },
    onError: (mutationError) => setError(getLoginErrorMessage(mutationError)),
  })

  const isNetworkError = error === '无法连接到服务器，请检查网络'

  return (
    <Box className="auth-layout">
      <Box
        className="auth-showcase"
        display={{ base: 'none', lg: 'flex' }}
      >
        <div className="auth-showcase-content">
          <div className="auth-glow-primary" />
          <div className="auth-glow-secondary" />

          <Group gap="sm" mb={40}>
            <div
              className="brand-mark brand-mark--lg"
            >
              <Text c="white" fw={700}>DW</Text>
            </div>
            <Text c="var(--color-ink)" fw={600} size="lg">DocWeave</Text>
          </Group>

          <span className="info-chip">Knowledge OS</span>
          <Title c="var(--color-ink)" order={1} mt="md" mb="sm">让知识流动，<br />让协作发生。</Title>
          <Text c="var(--color-ink-muted)" maw={440} size="md">
            企业级文档知识库协作平台，支持多人实时协同编辑与 AI 智能问答，让团队知识真正活起来。
          </Text>

          <SimpleGrid cols={2} spacing="md" mt={40}>
            {features.map(({ icon: Icon, label, desc }) => (
              <div
                key={label}
                className="soft-panel auth-feature-card"
              >
                <Group gap="sm" mb={4} wrap="nowrap">
                  <div className="feature-icon-box">
                    <Icon size={16} color="var(--color-accent)" />
                  </div>
                  <Text c="var(--color-ink)" fw={600} size="sm">{label}</Text>
                </Group>
                <Text c="var(--color-ink-muted)" size="xs">{desc}</Text>
              </div>
            ))}
          </SimpleGrid>
        </div>
      </Box>

      {/* 右侧表单区 — 始终占满 */}
      <Box
        className="auth-form-shell"
        ml={{ lg: '42%' }}
        p={{ base: 24, lg: 48 }}
      >
        <Group gap="xs" mb={32} hiddenFrom="lg">
          <div
            className="brand-mark brand-mark--md"
          >
            <Text c="white" size="xs" fw={700}>DW</Text>
          </div>
          <Text fw={600} size="lg">DocWeave</Text>
        </Group>

        <Paper w="100%" maw={420} p={{ base: 24, md: 32 }} radius="lg" withBorder className="section-card">
          <Stack gap="md">
            <div>
              <Title order={2} mb={4}>欢迎回来</Title>
              <Text c="dimmed" mt={4}>登录你的工作区，开始协作</Text>
            </div>

            {import.meta.env.DEV ? (
              <Paper
                p="sm"
                radius="sm"
                className="dev-account-panel"
              >
                <Text size="sm" fw={600}>开发账号</Text>
                <Text size="xs" c="dimmed">
                  邮箱：owner@docweave.dev · 密码：docweave123
                </Text>
              </Paper>
            ) : null}

            <form onSubmit={(event) => { event.preventDefault(); setError(null); loginMutation.mutate({ email, password }) }}>
              <Stack gap="md">
                <TextInput
                  label="邮箱"
                  placeholder="owner@docweave.dev"
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                  required
                />
                <PasswordInput
                  label="密码"
                  placeholder="输入密码"
                  value={password}
                  onChange={(event) => setPassword(event.currentTarget.value)}
                  required
                />
                <Button type="submit" fullWidth loading={loginMutation.isPending}>
                  {loginMutation.isPending ? '登录中...' : '登录'}
                </Button>
              </Stack>
            </form>

            {error ? (
              <Alert className="status-alert status-alert--error" color="red" icon={<AlertCircle size={18} />} variant="light">
                <Stack gap="xs">
                  <Text size="sm">{error}</Text>
                  {isNetworkError ? (
                    <Button size="xs" variant="light" onClick={() => loginMutation.mutate({ email, password })}>
                      重试
                    </Button>
                  ) : null}
                </Stack>
              </Alert>
            ) : null}

            <Text size="sm" ta="center" c="dimmed">
              还没有账号？注册页将在后续阶段接入。
            </Text>
          </Stack>
        </Paper>
      </Box>
    </Box>
  )
}
