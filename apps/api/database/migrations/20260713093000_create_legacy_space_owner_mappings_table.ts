import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Records operator-verified ownership for spaces created before memberships existed.
 * The rows are intentionally retained after backfill as an authorization audit trail.
 */
export default class extends BaseSchema {
  protected tableName = 'legacy_space_owner_mappings'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('space_id').primary().references('id').inTable('spaces').onDelete('CASCADE')
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT')
      table.timestamp('mapped_at').notNullable()
    })
  }

  async down() {
    await this.schema.dropTable(this.tableName)
  }
}
