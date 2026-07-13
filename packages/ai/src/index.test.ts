import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAliyunAiRuntimeConfig } from '@docweave/adapters'
import { createAiRuntime } from './index.js'

test('exposes a language model for editor streaming', () => {
  const runtime = createAiRuntime(
    createAliyunAiRuntimeConfig({
      apiKey: 'test-key',
    }),
  )

  assert.equal(typeof runtime.getChatModel, 'function')
  const model = runtime.getChatModel()

  if (typeof model === 'string') {
    throw new TypeError('Expected a provider language model')
  }

  assert.equal('doGenerate' in model, true)
})
