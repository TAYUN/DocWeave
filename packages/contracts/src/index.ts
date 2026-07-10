/**
 * 项目规范：默认应优先从领域子路径导入。
 * 例如：
 * `@docweave/contracts/document`
 * `@docweave/contracts/space`
 * `@docweave/contracts/auth`
 */
export type { CurrentUserDto } from './auth.js'
export {
  buildDocumentRoomName,
  parseDocumentRoomName,
} from './collaboration.js'
export type {
  CollaborationAwarenessState,
  CollaborationCapabilities,
  CollaborationConnectionStatus,
  CollaborationPresenceEntry,
  CollaborationTokenPayload,
  CollaborationUserIdentity,
} from './collaboration.js'
export type {
  CreateDocumentIndexJobInput,
  CreateDocumentIndexJobResultDto,
  CreateDocumentInput,
  CreateDocumentSnapshotResultDto,
  DocumentContent,
  DocumentDetailDto,
  DocumentIndexJobDto,
  DocumentIndexJobStage,
  DocumentIndexJobStatus,
  DocumentProcessingStatusDto,
  DocumentSnapshotContentFormat,
  DocumentSnapshotDto,
  DocumentSnapshotSummaryDto,
  DocumentStatus,
  DocumentSummaryDto,
  UpdateDocumentInput,
} from './document.js'
export type {
  CreateSpaceInput,
  SpaceDto,
  SpaceTreeDocumentDto,
  SpaceTreeDto,
} from './space.js'
