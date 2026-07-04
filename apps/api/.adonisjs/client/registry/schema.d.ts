/* eslint-disable prettier/prettier */
/// <reference path="../manifest.d.ts" />

import type { ExtractBody, ExtractErrorResponse, ExtractQuery, ExtractQueryForGet, ExtractResponse } from '@tuyau/core/types'
import type { InferInput, SimpleError } from '@vinejs/vine/types'

export type ParamValue = string | number | bigint | boolean

export interface Registry {
  'auth.login': {
    methods: ["POST"]
    pattern: '/api/auth/login'
    types: {
      body: {}
      paramsTuple: []
      params: {}
      query: {}
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
    }
  }
  'documents.update': {
    methods: ["PATCH"]
    pattern: '/api/documents/:documentId'
    types: {
      body: {}
      paramsTuple: [ParamValue]
      params: { documentId: ParamValue }
      query: {}
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
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
      response: unknown
      errorResponse: unknown
    }
  }
}
