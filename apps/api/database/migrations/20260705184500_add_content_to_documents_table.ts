import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // Keep the document body close to the existing metadata row for the single-user editor baseline.
      table
        .text('content')
        .notNullable()
        .defaultTo('[{"type":"paragraph","content":"Start writing your document here."}]')
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('content')
    })
  }
}
