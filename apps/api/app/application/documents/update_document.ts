import type { DocumentDetailDto, UpdateDocumentInput } from '@docweave/contracts/document'
import DocweaveCatalogService from '#services/docweave_catalog_service'

export class EmptyDocumentPatchError extends Error {
  constructor() {
    super('At least one editable field is required')
  }
}

function hasEditableField(patch: UpdateDocumentInput) {
  // 更新 contract 采用 patch 语义后，这里集中守住“至少改一个字段”的业务边界。
  return patch.title !== undefined || patch.summary !== undefined || patch.content !== undefined
}

export async function updateDocument(
  documentId: string,
  patch: UpdateDocumentInput,
  catalog = new DocweaveCatalogService(),
): Promise<DocumentDetailDto | null> {
  if (!hasEditableField(patch)) {
    throw new EmptyDocumentPatchError()
  }

  return catalog.updateDocument(documentId, patch)
}
