import {
  parseDocumentRoomName,
  type CollaborationTokenPayload,
} from '@docweave/contracts/collaboration'
import { createHmac, timingSafeEqual } from 'node:crypto'

export type CollabConnectionContext = {
  tokenPayload?: CollaborationTokenPayload
}

export function authenticateCollaborationConnection(input: {
  documentName: string
  token: string
  secret: string
}) {
  const payload = verifyCollaborationToken(input.token, input.secret)
  const parsedRoom = parseDocumentRoomName(input.documentName)

  if (!parsedRoom) {
    throw new Error('Invalid collaboration room name')
  }

  if (payload.roomName !== input.documentName) {
    throw new Error('Collaboration token room mismatch')
  }

  if (
    parsedRoom.workspaceId !== payload.workspaceId ||
    parsedRoom.documentId !== payload.documentId
  ) {
    throw new Error('Collaboration token payload mismatch')
  }

  return payload
}

function verifyCollaborationToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    throw new Error('Invalid collaboration token format')
  }

  const expectedSignature = createHmac('sha256', secret).update(encodedPayload).digest('base64url')

  if (!safeEqual(signature, expectedSignature)) {
    throw new Error('Invalid collaboration token signature')
  }

  const payload = JSON.parse(
    Buffer.from(encodedPayload, 'base64url').toString('utf8')
  ) as CollaborationTokenPayload

  if (payload.expiresAt <= Math.floor(Date.now() / 1000)) {
    throw new Error('Collaboration token expired')
  }

  return payload
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}
