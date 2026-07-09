export type CollaborationCapabilities = {
  canRead: boolean
  canEdit: boolean
}

export type CollaborationUserIdentity = {
  id: number
  email: string
  fullName: string | null
  initials: string
}

export type CollaborationTokenPayload = {
  version: 'v1'
  workspaceId: string
  documentId: string
  roomName: string
  capabilities: CollaborationCapabilities
  user: CollaborationUserIdentity
  issuedAt: number
  expiresAt: number
}

export type CollaborationAwarenessState = {
  user: CollaborationUserIdentity
  canEdit: boolean
}

export type CollaborationPresenceState = {
  user: CollaborationUserIdentity
  canEdit: boolean
}

export type CollaborationPresenceEntry = CollaborationUserIdentity & {
  canEdit: boolean
  isCurrentUser: boolean
}

export type CollaborationConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'unauthorized'
  | 'error'

export function buildDocumentRoomName(workspaceId: string, documentId: string) {
  return `workspace:${workspaceId}:document:${documentId}`
}

export function parseDocumentRoomName(roomName: string) {
  const match = /^workspace:([^:]+):document:([^:]+)$/.exec(roomName)

  if (!match) {
    return null
  }

  const [, workspaceId, documentId] = match

  return {
    workspaceId,
    documentId,
  }
}
