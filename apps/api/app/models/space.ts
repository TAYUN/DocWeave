import { DateTime } from 'luxon'
import { BaseModel, column, hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'
import Document from '#models/document'

export default class Space extends BaseModel {
  static table = 'spaces'

  @column({ isPrimary: true })
  declare id: string

  @column()
  declare name: string

  @column()
  declare summary: string

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @hasMany(() => Document)
  declare documents: HasMany<typeof Document>
}
