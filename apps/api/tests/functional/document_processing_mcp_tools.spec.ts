import { test } from '@japa/runner'
import type {
  CreateDocumentIndexJobResultDto,
  CreateDocumentSnapshotResultDto,
  DocumentProcessingStatusDto,
} from '@docweave/contracts/document'
import type DocumentProcessingService from '#services/document_processing_service'
import {
  MissingStableSnapshotError,
  SnapshotVersionNotFoundError,
} from '#services/document_processing_service'
import { apiErrors, apiSuccessMessages } from '#exceptions/error_messages'
import CreateDocumentSnapshotTool from '../../app/mcp/tools/create_document_snapshot_tool.js'
import GetDocumentProcessingStatusTool from '../../app/mcp/tools/get_document_processing_status_tool.js'
import TriggerDocumentIndexTool from '../../app/mcp/tools/trigger_document_index_tool.js'

type MockResponseResult =
  | { type: 'structured'; payload: Record<string, unknown> }
  | { type: 'error'; message: string | undefined }

function createMockResponse() {
  return {
    structured(payload: Record<string, unknown>): MockResponseResult {
      return {
        type: 'structured',
        payload,
      }
    },
    error(message?: string): MockResponseResult {
      return {
        type: 'error',
        message,
      }
    },
  }
}

test.group('document processing mcp tools', () => {
  test('create_document_snapshot returns structured snapshot result', async ({ assert }) => {
    const tool = new CreateDocumentSnapshotTool()
    const expected: CreateDocumentSnapshotResultDto = {
      latestSnapshotVersion: 3,
      snapshot: {
        id: 'snapshot-3',
        documentId: 'doc-1',
        version: 3,
        content: '[{"type":"paragraph","content":"v3"}]',
        contentFormat: 'blocknote_json',
        sourceDocumentUpdatedAt: '2026-07-10T12:00:00.000Z',
        createdAt: '2026-07-10T12:00:01.000Z',
      },
    }

    ;(
      tool as unknown as { processing: Pick<DocumentProcessingService, 'createSnapshot'> }
    ).processing = {
      createSnapshot: async (documentId: string) => {
        assert.equal(documentId, 'doc-1')
        return expected
      },
    }

    const result = await tool.handle({
      args: {
        documentId: 'doc-1',
      },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(result, {
      type: 'structured',
      payload: {
        message: apiSuccessMessages.documentSnapshotCreated,
        snapshot: expected.snapshot,
        latestSnapshotVersion: 3,
      },
    })
  })

  test('trigger_document_index uses current MCP auth boundary and handles service errors', async ({
    assert,
  }) => {
    const tool = new TriggerDocumentIndexTool()
    const expected: CreateDocumentIndexJobResultDto = {
      job: {
        id: 'job-1',
        documentId: 'doc-1',
        targetSnapshotVersion: 2,
        status: 'pending',
        stage: 'queued',
        requestedByUserId: 7,
        attemptCount: 0,
        errorCode: null,
        errorMessage: null,
        createdAt: '2026-07-10T12:00:02.000Z',
        startedAt: null,
        finishedAt: null,
      },
      latestSnapshotVersion: 2,
      latestIndexedVersion: 1,
    }

    let callCount = 0
    ;(
      tool as unknown as { processing: Pick<DocumentProcessingService, 'triggerIndex'> }
    ).processing = {
      triggerIndex: async (documentId, requestedByUserId, input) => {
        callCount += 1

        if (callCount === 1) {
          assert.equal(documentId, 'doc-1')
          assert.equal(requestedByUserId, null)
          assert.deepEqual(input, {
            snapshotVersion: 2,
          })
          return expected
        }

        if (callCount === 2) {
          throw new MissingStableSnapshotError()
        }

        throw new SnapshotVersionNotFoundError()
      },
    }

    const success = await tool.handle({
      args: {
        documentId: 'doc-1',
        snapshotVersion: 2,
      },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(success, {
      type: 'structured',
      payload: {
        message: apiSuccessMessages.documentIndexTriggered,
        job: expected.job,
        latestSnapshotVersion: 2,
        latestIndexedVersion: 1,
      },
    })

    const missingSnapshot = await tool.handle({
      args: {
        documentId: 'doc-1',
      },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(missingSnapshot, {
      type: 'error',
      message: apiErrors.missingStableSnapshot.message,
    })

    const missingVersion = await tool.handle({
      args: {
        documentId: 'doc-1',
      },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(missingVersion, {
      type: 'error',
      message: apiErrors.snapshotNotFound.message,
    })
  })

  test('get_document_processing_status returns status summary', async ({ assert }) => {
    const tool = new GetDocumentProcessingStatusTool()
    const expected: DocumentProcessingStatusDto = {
      documentId: 'doc-1',
      latestSnapshotVersion: 2,
      latestIndexedVersion: 1,
      latestSnapshot: {
        documentId: 'doc-1',
        version: 2,
        contentFormat: 'blocknote_json',
        createdAt: '2026-07-10T12:00:01.000Z',
      },
      latestIndexJob: {
        id: 'job-2',
        documentId: 'doc-1',
        targetSnapshotVersion: 2,
        status: 'running',
        stage: 'embedding',
        requestedByUserId: 7,
        attemptCount: 1,
        errorCode: null,
        errorMessage: null,
        createdAt: '2026-07-10T12:00:03.000Z',
        startedAt: '2026-07-10T12:00:04.000Z',
        finishedAt: null,
      },
    }

    ;(tool as unknown as { processing: Pick<DocumentProcessingService, 'getStatus'> }).processing =
      {
        getStatus: async (documentId: string) => {
          assert.equal(documentId, 'doc-1')
          return expected
        },
      }

    const result = await tool.handle({
      args: {
        documentId: 'doc-1',
      },
      response: createMockResponse(),
    } as never)

    assert.deepEqual(result, {
      type: 'structured',
      payload: {
        status: expected,
      },
    })
  })
})
