export type CitationLocationSearchInput = Record<string, unknown>

export function validateCitationLocationSearch(search: CitationLocationSearchInput) {
  const snapshotVersion = Number(search.snapshotVersion)
  const blockId = typeof search.blockId === 'string' ? search.blockId.trim() : undefined

  return {
    snapshotVersion:
      Number.isInteger(snapshotVersion) && snapshotVersion > 0 ? snapshotVersion : undefined,
    blockId: blockId || undefined,
  }
}
