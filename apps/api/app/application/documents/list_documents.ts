import type { DocumentSummaryDto } from '@docweave/contracts/document'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export async function listDocuments(
  catalog = new DocweaveCatalogService()
): Promise<DocumentSummaryDto[]> {
  return catalog.listDocuments()
}
