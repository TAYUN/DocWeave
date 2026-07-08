import type { CreateSpaceInput, SpaceDto } from '@docweave/contracts/space'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export async function createSpace(
  input: CreateSpaceInput,
  catalog = new DocweaveCatalogService(),
): Promise<SpaceDto> {
  return catalog.createSpace(input)
}
