import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'documents'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      // M4 keeps the latest stable snapshot pointer separate from the latest successfully indexed pointer.
      table.integer('latest_snapshot_version').nullable()
      table.integer('latest_indexed_version').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('latest_snapshot_version')
      table.dropColumn('latest_indexed_version')
    })
  }
}
