import {
  Server,
  type onAuthenticatePayload,
  type onDisconnectPayload,
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
        const existingFragment = existing.getXmlFragment(COLLAB_FRAGMENT_NAME)

        if (existingFragment.length > 0) {
          return existing
        }

        // 空缓存可能来自协同编辑器尚未完成初始化时的首帧连接；丢弃它，
        // 让本次加载重新读取 API 的持久化正文，避免空文档覆盖真实内容。
        documents.delete(data.documentName)
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

      await persistDocumentRuntime(runtime, documentId, data.document)
    },
    async onDisconnect(data: onDisconnectPayload<CollabConnectionContext>) {
      if (data.clientsCount !== 0) {
        return
      }

      const documentId = data.context?.tokenPayload?.documentId

      if (!documentId) {
        return
      }

      // 路由切换会销毁最后一个浏览器 provider；此时显式回写一次，
      // 不把未达到 debounce 窗口的最后一段草稿留在内存中。
      await persistDocumentRuntime(runtime, documentId, data.document)

      // 最后一个客户端离开后不继续保留 Yjs 运行态。外部保存、快照或 seed
      // 可能已更新 API 正文；下次打开必须从持久化真相恢复，避免 Citation 指向
      // 当前快照中存在、却在陈旧房间缓存里缺失的 block。
      documents.delete(data.documentName)
    },
  })
}

async function persistDocumentRuntime(
  runtime: CollaborationRuntimeClient,
  documentId: string,
  document: Y.Doc,
) {
  await runtime.updateDocumentRuntime(documentId, {
    // M4 第二阶段只回写可恢复正文，不在自动持久化里顺手创建稳定快照。
    content: serializeYDocContent({
      document,
      fragmentName: COLLAB_FRAGMENT_NAME,
    }),
  })
}
