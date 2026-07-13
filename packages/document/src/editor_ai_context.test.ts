import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildEditorAiContext } from './editor_ai_context.js'

test('builds bounded local editor context', () => {
  const context = buildEditorAiContext({
    title: 'M5',
    content: JSON.stringify([
      { id: 'first', type: 'paragraph', content: 'Current paragraph' },
      { id: 'second', type: 'paragraph', content: 'Nearby paragraph' },
    ]),
    currentBlockId: 'first',
    selectedText: 'Selected text',
    maxCharacters: 20,
  })

  assert.equal(context.documentTitle, 'M5')
  assert.equal(context.selectedText, 'Selected text')
  assert.ok(context.currentBlockText.length <= 20)
  assert.ok(context.surroundingText.length <= 20)
})
