import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MantineProvider, createTheme } from '@mantine/core'
import { Notifications } from '@mantine/notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import '@mantine/core/styles.css'
import '@mantine/notifications/styles.css'
import './index.css'
import { router } from './router'

const queryClient = new QueryClient()
const theme = createTheme({
  primaryColor: 'cinnamon',
  fontFamily: '"Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif',
  headings: {
    fontFamily: 'Georgia, "Times New Roman", serif',
  },
  defaultRadius: 'md',
  colors: {
    cinnamon: [
      '#fff3ea',
      '#fde5d2',
      '#f6c8a6',
      '#eeab79',
      '#e89152',
      '#e08038',
      '#dc7729',
      '#c4651e',
      '#af5918',
      '#984b10',
    ],
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 在应用入口统一挂载 Mantine，保证产品 UI 与 BlockNote 适配层共享同一套设计基线。 */}
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </MantineProvider>
  </StrictMode>,
)
