import type { SpaceDto } from '@docweave/contracts/space'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export async function listSpaces(
  catalog = new DocweaveCatalogService(),
): Promise<SpaceDto[]> {
  return catalog.listSpaces()
}
