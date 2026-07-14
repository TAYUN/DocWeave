import assert from 'node:assert/strict'
import test from 'node:test'
import { toCitationLocationSearch } from '../src/features/rag/citation-navigation.ts'
import { validateCitationLocationSearch } from '../src/features/rag/citation-location-search.ts'
import { locateCitationBlock } from '../src/pages/documents/citation-locator.ts'

test('serializes Citation location and accepts numeric route query strings safely', () => {
  assert.deepEqual(
    toCitationLocationSearch({
      id: 'citation-1',
      documentId: 'document-1',
      snapshotVersion: 7,
      blockId: 'block-1',
      quote: null,
    }),
    { snapshotVersion: 7, blockId: 'block-1' },
  )
  assert.deepEqual(validateCitationLocationSearch({ snapshotVersion: '7', blockId: ' block-1 ' }), {
    snapshotVersion: 7,
    blockId: 'block-1',
  })
  assert.deepEqual(validateCitationLocationSearch({ snapshotVersion: '0', blockId: '   ' }), {
    snapshotVersion: undefined,
    blockId: undefined,
  })
  assert.deepEqual(validateCitationLocationSearch({ snapshotVersion: 'not-a-number', blockId: 7 }), {
    snapshotVersion: undefined,
    blockId: undefined,
  })
})

test('locates the current Citation block without making a missing historical target fatal', () => {
  const calls: string[] = []
  const classes = new Set<string>()
  const target = {
    dataset: { id: 'block-1' },
    classList: {
      add: (name: string) => { classes.add(name); calls.push(`add:${name}`) },
      remove: (name: string) => { classes.delete(name); calls.push(`remove:${name}`) },
    },
    scrollIntoView: () => calls.push('scroll'),
    querySelector: () => ({ focus: () => calls.push('focus') }),
  }
  let state = 'pending'

  locateCitationBlock({
    editor: {
      getBlock: () => ({ id: 'block-1' }),
      setTextCursorPosition: () => calls.push('cursor'),
    },
    blockId: 'block-1',
    editorSurface: { querySelectorAll: () => [target] } as unknown as HTMLElement,
    onLocated: () => { state = 'located' },
    onNotFound: () => { state = 'not-found' },
    schedule: (callback) => { callback(0); return 1 },
    scheduleCleanup: (callback) => { callback(); return 1 },
  })

  assert.equal(state, 'located')
  assert.deepEqual(calls, ['cursor', 'scroll', 'focus', 'add:rag-citation-target', 'remove:rag-citation-target'])
  assert.equal(classes.size, 0)

  locateCitationBlock({
    editor: { getBlock: () => undefined, setTextCursorPosition: () => calls.push('unexpected-cursor') },
    blockId: 'missing-block',
    editorSurface: null,
    onLocated: () => { state = 'located' },
    onNotFound: () => { state = 'not-found' },
    schedule: () => 1,
    scheduleCleanup: () => 1,
  })

  assert.equal(state, 'not-found')
})
