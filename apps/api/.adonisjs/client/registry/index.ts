/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

const placeholder: any = {}

const routes = {
  'mcp.post': {
    methods: ["POST"],
    pattern: '/mcp',
    tokens: [{"old":"/mcp","type":0,"val":"mcp","end":""}],
    types: placeholder as Registry['mcp.post']['types'],
  },
  'auth.login': {
    methods: ["POST"],
    pattern: '/api/auth/login',
    tokens: [{"old":"/api/auth/login","type":0,"val":"api","end":""},{"old":"/api/auth/login","type":0,"val":"auth","end":""},{"old":"/api/auth/login","type":0,"val":"login","end":""}],
    types: placeholder as Registry['auth.login']['types'],
  },
  'auth.logout': {
    methods: ["POST"],
    pattern: '/api/auth/logout',
    tokens: [{"old":"/api/auth/logout","type":0,"val":"api","end":""},{"old":"/api/auth/logout","type":0,"val":"auth","end":""},{"old":"/api/auth/logout","type":0,"val":"logout","end":""}],
    types: placeholder as Registry['auth.logout']['types'],
  },
  'auth.me': {
    methods: ["GET","HEAD"],
    pattern: '/api/auth/me',
    tokens: [{"old":"/api/auth/me","type":0,"val":"api","end":""},{"old":"/api/auth/me","type":0,"val":"auth","end":""},{"old":"/api/auth/me","type":0,"val":"me","end":""}],
    types: placeholder as Registry['auth.me']['types'],
  },
  'spaces.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/spaces',
    tokens: [{"old":"/api/spaces","type":0,"val":"api","end":""},{"old":"/api/spaces","type":0,"val":"spaces","end":""}],
    types: placeholder as Registry['spaces.index']['types'],
  },
  'spaces.store': {
    methods: ["POST"],
    pattern: '/api/spaces',
    tokens: [{"old":"/api/spaces","type":0,"val":"api","end":""},{"old":"/api/spaces","type":0,"val":"spaces","end":""}],
    types: placeholder as Registry['spaces.store']['types'],
  },
  'spaces.tree': {
    methods: ["GET","HEAD"],
    pattern: '/api/spaces/:spaceId/tree',
    tokens: [{"old":"/api/spaces/:spaceId/tree","type":0,"val":"api","end":""},{"old":"/api/spaces/:spaceId/tree","type":0,"val":"spaces","end":""},{"old":"/api/spaces/:spaceId/tree","type":1,"val":"spaceId","end":""},{"old":"/api/spaces/:spaceId/tree","type":0,"val":"tree","end":""}],
    types: placeholder as Registry['spaces.tree']['types'],
  },
  'documents.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/documents',
    tokens: [{"old":"/api/documents","type":0,"val":"api","end":""},{"old":"/api/documents","type":0,"val":"documents","end":""}],
    types: placeholder as Registry['documents.index']['types'],
  },
  'documents.store': {
    methods: ["POST"],
    pattern: '/api/documents',
    tokens: [{"old":"/api/documents","type":0,"val":"api","end":""},{"old":"/api/documents","type":0,"val":"documents","end":""}],
    types: placeholder as Registry['documents.store']['types'],
  },
  'documents.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/documents/:documentId',
    tokens: [{"old":"/api/documents/:documentId","type":0,"val":"api","end":""},{"old":"/api/documents/:documentId","type":0,"val":"documents","end":""},{"old":"/api/documents/:documentId","type":1,"val":"documentId","end":""}],
    types: placeholder as Registry['documents.show']['types'],
  },
  'documents.update': {
    methods: ["PATCH"],
    pattern: '/api/documents/:documentId',
    tokens: [{"old":"/api/documents/:documentId","type":0,"val":"api","end":""},{"old":"/api/documents/:documentId","type":0,"val":"documents","end":""},{"old":"/api/documents/:documentId","type":1,"val":"documentId","end":""}],
    types: placeholder as Registry['documents.update']['types'],
  },
  'collaboration_tokens.store': {
    methods: ["POST"],
    pattern: '/api/collaboration/token',
    tokens: [{"old":"/api/collaboration/token","type":0,"val":"api","end":""},{"old":"/api/collaboration/token","type":0,"val":"collaboration","end":""},{"old":"/api/collaboration/token","type":0,"val":"token","end":""}],
    types: placeholder as Registry['collaboration_tokens.store']['types'],
  },
  'ai_editor.store': {
    methods: ["POST"],
    pattern: '/api/ai/editor',
    tokens: [{"old":"/api/ai/editor","type":0,"val":"api","end":""},{"old":"/api/ai/editor","type":0,"val":"ai","end":""},{"old":"/api/ai/editor","type":0,"val":"editor","end":""}],
    types: placeholder as Registry['ai_editor.store']['types'],
  },
  'rag.search': {
    methods: ["POST"],
    pattern: '/api/rag/search',
    tokens: [{"old":"/api/rag/search","type":0,"val":"api","end":""},{"old":"/api/rag/search","type":0,"val":"rag","end":""},{"old":"/api/rag/search","type":0,"val":"search","end":""}],
    types: placeholder as Registry['rag.search']['types'],
  },
  'rag.chat': {
    methods: ["POST"],
    pattern: '/api/rag/chat',
    tokens: [{"old":"/api/rag/chat","type":0,"val":"api","end":""},{"old":"/api/rag/chat","type":0,"val":"rag","end":""},{"old":"/api/rag/chat","type":0,"val":"chat","end":""}],
    types: placeholder as Registry['rag.chat']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
