import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createAiRuntime } from './index.js'

test('exposes a language model for editor streaming', () => {
  const runtime = createAiRuntime({
    provider: 'aliyun_openai_compatible',
    apiKey: 'test-key',
    baseURL: 'https://example.test/v1',
    chatModel: {
      provider: 'aliyun_openai_compatible',
      kind: 'chat',
      model: 'qwen-plus',
    },
    embeddingModel: {
      provider: 'aliyun_openai_compatible',
      kind: 'embedding',
      model: 'text-embedding-v4',
    },
    embeddingDimensions: 1024,
  })

  assert.equal(typeof runtime.getChatModel, 'function')
  const model = runtime.getChatModel()

  if (typeof model === 'string') {
    throw new TypeError('Expected a provider language model')
  }

  assert.equal('doGenerate' in model, true)
})
