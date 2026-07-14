import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'space_members'

  async up() {
    const unmappedLegacySpace = await this.db
      .from('spaces')
      .leftJoin('legacy_space_owner_mappings', 'spaces.id', 'legacy_space_owner_mappings.space_id')
      .whereNull('legacy_space_owner_mappings.space_id')
      .select('spaces.id')
      .first()

    // `spaces` did not record an owner before M6. Guessing one would grant access
    // to the wrong account, so every existing space needs an operator-verified mapping.
    if (unmappedLegacySpace) {
      throw new Error(
        `Cannot migrate legacy space ${unmappedLegacySpace.id} without an explicit owner mapping`
      )
    }

    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').notNullable()
      table.string('space_id').notNullable().references('id').inTable('spaces').onDelete('CASCADE')
      table.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
      table.string('role', 24).notNullable()
      table.timestamp('created_at').notNullable()
      table.timestamp('updated_at').nullable()
      table.unique(['space_id', 'user_id'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
