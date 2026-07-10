import type { DocumentSnapshotContentFormat } from '@docweave/contracts/document'
import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Document from '#models/document'

export default class DocumentSnapshot extends BaseModel {
  static table = 'document_snapshots'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare documentId: string

  @column()
  declare version: number

  @column()
  declare content: string

  @column()
  declare contentFormat: DocumentSnapshotContentFormat

  @column.dateTime()
  declare sourceDocumentUpdatedAt: DateTime | null

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime | null

  @belongsTo(() => Document)
  declare document: BelongsTo<typeof Document>
}
