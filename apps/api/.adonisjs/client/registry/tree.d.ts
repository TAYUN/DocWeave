/* eslint-disable prettier/prettier */
import type { routes } from './index.ts'

export interface ApiDefinition {
  mcp: {
    post: typeof routes['mcp.post']
  }
  auth: {
    login: typeof routes['auth.login']
    logout: typeof routes['auth.logout']
    me: typeof routes['auth.me']
  }
  spaces: {
    index: typeof routes['spaces.index']
    store: typeof routes['spaces.store']
    tree: typeof routes['spaces.tree']
  }
  documents: {
    index: typeof routes['documents.index']
    store: typeof routes['documents.store']
    show: typeof routes['documents.show']
    update: typeof routes['documents.update']
  }
  collaborationTokens: {
    store: typeof routes['collaboration_tokens.store']
  }
  aiEditor: {
    store: typeof routes['ai_editor.store']
  }
  rag: {
    search: typeof routes['rag.search']
    chat: typeof routes['rag.chat']
  }
}
