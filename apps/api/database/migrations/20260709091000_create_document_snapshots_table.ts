import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'document_snapshots'

  async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.string('id').primary()
      table
        .string('document_id')
        .notNullable()
        .references('id')
        .inTable('documents')
        .onDelete('CASCADE')
      table.integer('version').notNullable()
      table.text('content').notNullable()
      table.string('content_format', 64).notNullable()
      table.timestamp('source_document_updated_at').nullable()
      table.timestamp('created_at').notNullable().defaultTo(this.now())

      table.unique(['document_id', 'version'])
      table.index(['document_id', 'created_at'])
    })
  }

  async down() {
    this.schema.dropTable(this.tableName)
  }
}
