/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'mcp.post': {
    methods: ["POST"]
    pattern: '/mcp'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
    }
  }
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['login']>>>
    }
  }
  'auth.logout': {
    methods: ["POST"]
    pattern: '/api/auth/logout'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['logout']>>>
    }
  }
  'auth.me': {
    methods: ["GET","HEAD"]
    pattern: '/api/auth/me'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/auth_controller').default['me']>>>
    }
  }
  'spaces.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/spaces'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/spaces_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/spaces_controller').default['index']>>>
    }
  }
  'spaces.store': {
    methods: ["POST"]
    pattern: '/api/spaces'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/spaces').createSpaceValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/spaces').createSpaceValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/spaces_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/spaces_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'spaces.tree': {
    methods: ["GET","HEAD"]
    pattern: '/api/spaces/:spaceId/tree'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { spaceId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/spaces_controller').default['tree']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/spaces_controller').default['tree']>>>
    }
  }
  'documents.index': {
    methods: ["GET","HEAD"]
    pattern: '/api/documents'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['index']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['index']>>>
    }
  }
  'documents.store': {
    methods: ["POST"]
    pattern: '/api/documents'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/documents').createDocumentValidator)>>
      paramsTuple: []
      params: {}
      query: ExtractQuery<InferInput<(typeof import('#validators/documents').createDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['store']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'documents.show': {
    methods: ["GET","HEAD"]
    pattern: '/api/documents/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { documentId: ParamValue }
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['show']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['show']>>>
    }
  }
  'documents.update': {
    methods: ["PATCH"]
    pattern: '/api/documents/:documentId'
    types: {
      body: ExtractBody<InferInput<(typeof import('#validators/documents').updateDocumentValidator)>>
      paramsTuple: [ParamValue]
      params: { documentId: ParamValue }
      query: ExtractQuery<InferInput<(typeof import('#validators/documents').updateDocumentValidator)>>
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['update']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/documents_controller').default['update']>>> | { status: 422; response: { errors: SimpleError[] } }
    }
  }
  'collaboration_tokens.store': {
    methods: ["POST"]
    pattern: '/api/collaboration/token'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/collaboration_tokens_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/collaboration_tokens_controller').default['store']>>>
    }
  }
  'ai_editor.store': {
    methods: ["POST"]
    pattern: '/api/ai/editor'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/ai_editor_controller').default['store']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/ai_editor_controller').default['store']>>>
    }
  }
  'rag.search': {
    methods: ["POST"]
    pattern: '/api/rag/search'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/rag_controller').default['search']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/rag_controller').default['search']>>>
    }
  }
  'rag.chat': {
    methods: ["POST"]
    pattern: '/api/rag/chat'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: ExtractResponse<Awaited<ReturnType<import('#controllers/rag_controller').default['chat']>>>
      errorResponse: ExtractErrorResponse<Awaited<ReturnType<import('#controllers/rag_controller').default['chat']>>>
    }
  }
}
