import type {
  CollaborationRuntimeDocumentDto,
  UpdateCollaborationRuntimeInput,
} from '@docweave/contracts/collaboration'
import type { CollabConfig } from './config.js'

type RuntimeClientOptions = Pick<CollabConfig, 'apiBaseUrl' | 'secret'>

export class CollaborationRuntimeClient {
  constructor(private options: RuntimeClientOptions) {}

  async getDocumentRuntime(documentId: string) {
    const response = await fetch(this.toUrl(documentId), {
      method: 'GET',
      headers: this.headers(),
    })

    if (response.status === 404) {
      return null
    }

    return this.readJson<CollaborationRuntimeDocumentDto>(response, '读取协同运行态正文失败')
  }

  async updateDocumentRuntime(documentId: string, input: UpdateCollaborationRuntimeInput) {
    const response = await fetch(this.toUrl(documentId), {
      method: 'PUT',
      headers: this.headers(),
      body: JSON.stringify(input),
    })

    if (response.status === 404) {
      return null
    }

    return this.readJson<CollaborationRuntimeDocumentDto>(response, '回写协同运行态正文失败')
  }

  private headers() {
    return {
      'content-type': 'application/json',
      'x-collaboration-secret': this.options.secret,
    }
  }

  private toUrl(documentId: string) {
    return `${this.options.apiBaseUrl}/api/internal/collaboration/documents/${documentId}/runtime`
  }

  private async readJson<T>(response: Response, fallback: string) {
    const payload = (await response.json().catch(() => ({}))) as {
      message?: string
      data?: T
    }

    if (!response.ok || !payload.data) {
      throw new Error(payload.message || fallback)
    }

    return payload.data
  }
}
