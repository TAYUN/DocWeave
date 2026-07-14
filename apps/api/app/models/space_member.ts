import { DateTime } from 'luxon'
import { BaseModel, belongsTo, column } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'
import Space from '#models/space'
import User from '#models/user'

export type SpaceMemberRole = 'owner' | 'viewer'

/**
 * Space membership is the single authorization source for space-scoped features.
 */
export default class SpaceMember extends BaseModel {
  static table = 'space_members'

  @column({ isPrimary: true })
  declare id: number

  @column()
  declare spaceId: string

  @column()
  declare userId: number

  @column()
  declare role: SpaceMemberRole

  @column.dateTime({ autoCreate: true })
  declare createdAt: DateTime

  @column.dateTime({ autoCreate: true, autoUpdate: true })
  declare updatedAt: DateTime | null

  @belongsTo(() => Space)
  declare space: BelongsTo<typeof Space>

  @belongsTo(() => User)
  declare user: BelongsTo<typeof User>
}
