import type { CreateDocumentInput, DocumentDetailDto } from '@docweave/contracts'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export async function createDocument(
  input: CreateDocumentInput,
  catalog = new DocweaveCatalogService(),
): Promise<DocumentDetailDto | null> {
  return catalog.createDocument(input)
}
