import type { ReactNode } from 'react'
import { AppShellDataContext, type AppShellData } from './app-shell-data'

export function AppShellDataProvider({
  children,
  value,
}: {
  children: ReactNode
  value: AppShellData
}) {
  return <AppShellDataContext.Provider value={value}>{children}</AppShellDataContext.Provider>
}
