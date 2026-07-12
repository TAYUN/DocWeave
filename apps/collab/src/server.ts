import {
  Server,
  type onAuthenticatePayload,
  type onLoadDocumentPayload,
  type onStoreDocumentPayload,
} from '@hocuspocus/server'
import {
  restoreYDocFromSerializedContent,
  serializeYDocContent,
} from '@docweave/adapters'
import * as Y from 'yjs'
import type { CollabConfig } from './config.js'
import {
  authenticateCollaborationConnection,
  type CollabConnectionContext,
} from './auth.js'
import { CollaborationRuntimeClient } from './runtime_client.js'

const documents = new Map<string, Y.Doc>()
const COLLAB_FRAGMENT_NAME = 'document-store'

export function createCollaborationServer(config: CollabConfig) {
  const runtime = new CollaborationRuntimeClient(config)

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

      const documentId = data.context.tokenPayload?.documentId
      const runtimeDocument = documentId
        ? await runtime.getDocumentRuntime(documentId)
        : null
      const document =
        runtimeDocument && runtimeDocument.content
          ? restoreYDocFromSerializedContent({
              content: runtimeDocument.content,
              fragmentName: COLLAB_FRAGMENT_NAME,
            })
          : new Y.Doc()

      documents.set(data.documentName, document)
      return document
    },
    async onStoreDocument(data: onStoreDocumentPayload<CollabConnectionContext>) {
      const documentId = data.lastContext?.tokenPayload?.documentId

      if (!documentId) {
        return
      }

      await runtime.updateDocumentRuntime(documentId, {
        // M4 第二阶段只回写可恢复正文，不在自动持久化里顺手创建稳定快照。
        content: serializeYDocContent({
          document: data.document,
          fragmentName: COLLAB_FRAGMENT_NAME,
        }),
      })
    },
  })
}
