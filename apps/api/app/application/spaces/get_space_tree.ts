import type { SpaceTreeDto } from '@docweave/contracts/space'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export async function getSpaceTree(
  spaceId: string,
  catalog = new DocweaveCatalogService(),
): Promise<SpaceTreeDto | null> {
  return catalog.getSpaceTree(spaceId)
}
