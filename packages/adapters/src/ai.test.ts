import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createAliyunAiRuntimeConfig, createAliyunFetch } from './ai.js'

test('injects DashScope request options only when explicitly enabled', async () => {
  const calls: RequestInit[] = []
  const originalFetch = globalThis.fetch

  globalThis.fetch = async (_input, init) => {
    calls.push(init ?? {})
    return new Response('{}')
  }

  try {
    const config = createAliyunAiRuntimeConfig({
      apiKey: 'test-key',
      chatModel: 'qwen3.6-plus',
      enableThinking: false,
    })
    const transport = createAliyunFetch(config)

    assert.ok(transport)
    await transport('https://example.test/v1/chat/completions', {
      body: JSON.stringify({
        model: 'qwen3.6-plus',
        tool_choice: 'required',
      }),
    })

    assert.deepEqual(JSON.parse(String(calls[0]?.body)), {
      model: 'qwen3.6-plus',
      tool_choice: 'required',
      enable_thinking: false,
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})
