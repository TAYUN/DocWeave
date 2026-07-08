import { createContext, useContext } from 'react'
import type { ApiDocumentSummary, ApiSpace, ApiSpaceTree, CurrentUser } from '@/lib/api'

export type AppShellTreeEntry = {
  space: ApiSpace
  tree: ApiSpaceTree | null
  isPending: boolean
  error: Error | null
}

export type AppShellData = {
  currentUser: CurrentUser
  documents: ApiDocumentSummary[]
  documentsError: Error | null
  documentsPending: boolean
  spaces: ApiSpace[]
  treeEntries: AppShellTreeEntry[]
}

export const AppShellDataContext = createContext<AppShellData | null>(null)

export function useAppShellData() {
  const value = useContext(AppShellDataContext)

  if (!value) {
    throw new Error('useAppShellData 只能在 AppShellDataProvider 中使用')
  }

  return value
}
