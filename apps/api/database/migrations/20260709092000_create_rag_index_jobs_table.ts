import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'rag_index_jobs'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .string('document_id')
        .notNullable()
        .references('id')
        .inTable('documents')
        .onDelete('CASCADE')
      table.integer('target_snapshot_version').notNullable()
      table.string('status', 32).notNullable()
      table.string('stage', 32).notNullable()
      table
        .integer('requested_by_user_id')
        .nullable()
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
      table.integer('attempt_count').notNullable().defaultTo(0)
      table.string('error_code', 120).nullable()
      table.text('error_message').nullable()
      table.timestamp('locked_at').nullable()
      table.timestamp('started_at').nullable()
      table.timestamp('finished_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())
      table.timestamp('updated_at').notNullable().defaultTo(this.now())

      table.index(['document_id', 'created_at'])
      table.index(['document_id', 'target_snapshot_version'])
      table.index(['status', 'locked_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
