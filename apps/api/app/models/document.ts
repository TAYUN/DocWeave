import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Space from '#models/space'

export default class Document extends BaseModel {
  static table = 'documents'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare spaceId: string

  @column()
  declare title: string

  @column()
  declare summary: string

  @column()
  declare status: 'draft' | 'review' | 'ready'

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Space)
  declare space: BelongsTo<typeof Space>
}
