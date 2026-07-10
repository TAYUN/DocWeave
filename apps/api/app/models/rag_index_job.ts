import type { DocumentIndexJobStage, DocumentIndexJobStatus } from '@docweave/contracts/document'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/document'

export default class RagIndexJob extends BaseModel {
  static table = 'rag_index_jobs'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare documentId: string

  @column()
  declare targetSnapshotVersion: number

  @column()
  declare status: DocumentIndexJobStatus

  @column()
  declare stage: DocumentIndexJobStage

  @column()
  declare requestedByUserId: number | null

  @column()
  declare attemptCount: number

  @column()
  declare errorCode: string | null

  @column()
  declare errorMessage: string | null

  @column.dateTime()
  declare lockedAt: DateTime | null

  @column.dateTime()
  declare startedAt: DateTime | null

  @column.dateTime()
  declare finishedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>
}
