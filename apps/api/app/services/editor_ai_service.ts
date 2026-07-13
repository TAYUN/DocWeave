import { createAliyunAiRuntimeConfig, createAliyunFetch } from '@docweave/adapters'
import { createAiRuntime } from '@docweave/ai'
import { buildEditorAiContext } from '@docweave/document'
import type { EditorAiAction } from '@docweave/contracts/ai'
import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import {
  aiDocumentFormats,
  injectDocumentStateMessages,
  toolDefinitionsToToolSet,
} from '@blocknote/xl-ai/server'
import env from '#start/env'
import Document from '#models/document'
import { apiErrors } from '#exceptions/error_messages'

type EditorAiPayload = {
  documentId: string
  action?: EditorAiAction
  messages: UIMessage[]
  toolDefinitions: Record<string, unknown>
  targetLanguage?: string
}

export class EditorAiDocumentNotFoundError extends Error {}
export class EditorAiProviderConfigError extends Error {}

export default class EditorAiService {
  async stream(input: { userId: number; payload: EditorAiPayload }) {
    // 当前 M2 权限基线以登录用户 + 文档存在性为准；后续空间成员 capability 接入时在此处扩展。
    const document = await Document.find(input.payload.documentId)

    if (!document) {
      throw new EditorAiDocumentNotFoundError(apiErrors.editorAiDocumentNotFound.message)
    }

    void input.userId

    const apiKey = env.get('DASHSCOPE_API_KEY')?.release()

    if (!apiKey) {
      throw new EditorAiProviderConfigError(apiErrors.editorAiProviderConfigMissing.message)
    }

    const runtimeConfig = createAliyunAiRuntimeConfig({
      apiKey,
      baseURL: env.get('DASHSCOPE_BASE_URL'),
      chatModel: env.get('CHAT_MODEL'),
      enableThinking: false,
    })
    const runtime = createAiRuntime(runtimeConfig, {
      fetch: createAliyunFetch(runtimeConfig),
    })
    const messages = injectDocumentStateMessages(input.payload.messages)
    const tools = toolDefinitionsToToolSet(input.payload.toolDefinitions as never)
    const localContext = buildEditorAiContext({
      title: document.title,
      content: document.content,
    })
    const actionInstruction = input.payload.action
      ? buildActionInstruction(input.payload.action, input.payload.targetLanguage)
      : 'Use the action requested by the current BlockNote AI command.'

    return streamText({
      model: runtime.getChatModel(),
      system: `${aiDocumentFormats.html.systemPrompt}\n\n${actionInstruction}\n\nDocument title: ${localContext.documentTitle}\nCurrent block: ${localContext.currentBlockText}\nNearby content: ${localContext.surroundingText}`,
      messages: await convertToModelMessages(messages),
      tools,
      toolChoice: 'required',
    }).toUIMessageStreamResponse()
  }
}

function buildActionInstruction(action: EditorAiAction, targetLanguage?: string) {
  if (action === 'translate') {
    return `Perform a precise translation into ${targetLanguage?.trim() || 'the requested target language'}.`
  }

  const instructions: Record<Exclude<EditorAiAction, 'translate'>, string> = {
    rewrite: 'Rewrite the selected or local content while preserving its meaning.',
    expand: 'Expand the selected or local content with useful, relevant detail.',
    shorten: 'Shorten the selected or local content while preserving key information.',
    summarize: 'Summarize the selected or local content concisely.',
  }

  return instructions[action]
}
