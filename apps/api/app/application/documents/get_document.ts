import type { DocumentDetailDto } from '@docweave/contracts'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export async function getDocument(
  documentId: string,
  catalog = new DocweaveCatalogService(),
): Promise<DocumentDetailDto | null> {
  return catalog.getDocument(documentId)
}
