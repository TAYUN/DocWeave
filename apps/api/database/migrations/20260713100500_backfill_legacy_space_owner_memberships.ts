import { BaseSchema } from '@adonisjs/lucid/schema'

/**
 * Applies the operator-verified audit mappings after the membership table exists.
 */
export default class extends BaseSchema {
  async up() {
    // Every mapping references an existing space and user through database FKs.
    await this.db.rawQuery(
      "INSERT INTO space_members (space_id, user_id, role, created_at) SELECT space_id, user_id, 'owner', NOW() FROM legacy_space_owner_mappings"
    )
  }

  async down() {
    await this.db.rawQuery(
      "DELETE FROM space_members WHERE role = 'owner' AND EXISTS (SELECT 1 FROM legacy_space_owner_mappings WHERE legacy_space_owner_mappings.space_id = space_members.space_id AND legacy_space_owner_mappings.user_id = space_members.user_id)"
    )
  }
}
