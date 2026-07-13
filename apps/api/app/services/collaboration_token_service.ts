import env from '#start/env'
import { ApiContractError, apiErrors } from '#exceptions/error_messages'
import {
  buildDocumentRoomName,
  type CollaborationCapabilities,
  type CollaborationSessionDto,
  type CollaborationTokenPayload,
  type CollaborationUserIdentity,
} from '@docweave/contracts/collaboration'
import type { DocumentDetailDto } from '@docweave/contracts/document'
import { createHmac, timingSafeEqual } from 'node:crypto'

export const COLLABORATION_TOKEN_PROVIDER = 'apps/collab'
export const COLLABORATION_TOKEN_TTL_SECONDS = 900

type CreateCollaborationTokenInput = {
  capabilities: CollaborationCapabilities
  document: Pick<DocumentDetailDto, 'id' | 'spaceId'>
  user: CollaborationUserIdentity
}

export function signCollaborationToken(payload: CollaborationTokenPayload, secret: string) {
  const encodedPayload = encodeBase64Url(JSON.stringify(payload))
  const signature = signValue(encodedPayload, secret)
  return `${encodedPayload}.${signature}`
}

export function verifyCollaborationToken(token: string, secret: string) {
  const [encodedPayload, signature] = token.split('.')

  if (!encodedPayload || !signature) {
    throw new ApiContractError(
      apiErrors.collaborationTokenFormatInvalid.code,
      apiErrors.collaborationTokenFormatInvalid.message
    )
  }

  const expectedSignature = signValue(encodedPayload, secret)

  if (!safeEqual(signature, expectedSignature)) {
    throw new ApiContractError(
      apiErrors.collaborationTokenSignatureInvalid.code,
      apiErrors.collaborationTokenSignatureInvalid.message
    )
  }

  const payload = JSON.parse(decodeBase64Url(encodedPayload)) as CollaborationTokenPayload

  if (payload.expiresAt <= nowInSeconds()) {
    throw new ApiContractError(
      apiErrors.collaborationTokenExpired.code,
      apiErrors.collaborationTokenExpired.message
    )
  }

  return payload
}

export default class CollaborationTokenService {
  constructor(
    private secret = env.get('COLLAB_SECRET').release(),
    private ttlSeconds = COLLABORATION_TOKEN_TTL_SECONDS
  ) {}

  issueDocumentToken(input: CreateCollaborationTokenInput): CollaborationSessionDto {
    const issuedAt = nowInSeconds()
    const expiresAt = issuedAt + this.ttlSeconds
    const roomName = buildDocumentRoomName(input.document.spaceId, input.document.id)
    const payload: CollaborationTokenPayload = {
      version: 'v1',
      workspaceId: input.document.spaceId,
      documentId: input.document.id,
      roomName,
      capabilities: input.capabilities,
      user: input.user,
      issuedAt,
      expiresAt,
    }

    return {
      documentId: input.document.id,
      roomName,
      token: signCollaborationToken(payload, this.secret),
      provider: COLLABORATION_TOKEN_PROVIDER,
      expiresInSeconds: this.ttlSeconds,
    }
  }
}

function nowInSeconds() {
  return Math.floor(Date.now() / 1000)
}

function signValue(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, 'utf8').toString('base64url')
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)

  if (leftBuffer.length !== rightBuffer.length) {
    return false
  }

  return timingSafeEqual(leftBuffer, rightBuffer)
}
