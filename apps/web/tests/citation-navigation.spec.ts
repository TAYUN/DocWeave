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
  let selector = ''
  const target = {
    dataset: { id: 'block-1' },
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
    editorSurface: {
      querySelector: (value: string) => { selector = value; return target },
      querySelectorAll: () => [target],
    } as unknown as HTMLElement,
    onLocated: () => { state = 'located' },
    onNotFound: () => { state = 'not-found' },
    schedule: (callback) => { callback(0); return 1 },
    scheduleCleanup: () => 1,
  })

  assert.equal(state, 'located')
  assert.equal(
    selector,
    '[data-node-type="blockContainer"][data-id="block-1"], [id="block-1"]',
  )
  assert.deepEqual(calls, ['cursor', 'scroll', 'focus'])

  locateCitationBlock({
    editor: { getBlock: () => undefined, setTextCursorPosition: () => calls.push('unexpected-cursor') },
    blockId: 'missing-block',
    editorSurface: null,
    onLocated: () => { state = 'located' },
    onNotFound: () => { state = 'not-found' },
    schedule: (callback) => { callback(0); return 1 },
    scheduleCleanup: (callback) => { callback(); return 1 },
  })

  assert.equal(state, 'not-found')
})

test('locates and highlights a rendered Citation block even when editor lookup is delayed', () => {
  let state = 'pending'
  const target = {
    dataset: { id: 'block-1' },
    scrollIntoView: () => undefined,
    querySelector: () => null,
  }

  locateCitationBlock({
    editor: {
      getBlock: () => undefined,
      setTextCursorPosition: () => undefined,
    },
    blockId: 'block-1',
    editorSurface: {
      querySelector: () => target,
      querySelectorAll: () => [target],
    } as unknown as HTMLElement,
    onLocated: () => { state = 'located' },
    onNotFound: () => { state = 'not-found' },
    schedule: (callback) => { callback(0); return 1 },
    scheduleCleanup: () => 1,
  })

  assert.equal(state, 'located')
})
