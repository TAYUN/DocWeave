import {
  Server,
  type onAuthenticatePayload,
  type onLoadDocumentPayload,
  type onStoreDocumentPayload,
} from '@hocuspocus/server'
import * as Y from 'yjs'
import type { CollabConfig } from './config.js'
import {
  authenticateCollaborationConnection,
  type CollabConnectionContext,
} from './auth.js'

const documents = new Map<string, Y.Doc>()

export function createCollaborationServer(config: CollabConfig) {
  return new Server<CollabConnectionContext>({
    address: config.host,
    port: config.port,
    quiet: true,
    async onAuthenticate(data: onAuthenticatePayload<CollabConnectionContext>) {
      const payload = authenticateCollaborationConnection({
        documentName: data.documentName,
        token: data.token,
        secret: config.secret,
      })

      data.context.tokenPayload = payload
      data.connectionConfig.readOnly = !payload.capabilities.canEdit
    },
    async onLoadDocument(data: onLoadDocumentPayload<CollabConnectionContext>) {
      const existing = documents.get(data.documentName)

      if (existing) {
        return existing
      }

      const document = new Y.Doc()
      documents.set(data.documentName, document)
      return document
    },
    async onStoreDocument(_data: onStoreDocumentPayload<CollabConnectionContext>) {
      // ponytail: keep only the hook boundary in M3; wire persistence when M4 actually needs it.
    },
  })
}
