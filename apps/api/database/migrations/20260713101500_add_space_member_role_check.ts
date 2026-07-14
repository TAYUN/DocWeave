import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'space_members'

  async up() {
    // The base table migration has already run in local environments; add the constraint safely.
    await this.db.rawQuery(
      "ALTER TABLE space_members ADD CONSTRAINT space_members_role_check CHECK (role IN ('owner', 'viewer'))"
    )
  }

  async down() {
    await this.db.rawQuery(
      'ALTER TABLE space_members DROP CONSTRAINT IF EXISTS space_members_role_check'
    )
  }
}
