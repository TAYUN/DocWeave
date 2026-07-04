import '@adonisjs/core/types/http'

type ParamValue = string | number | bigint | boolean

export type ScannedRoutes = {
  ALL: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'auth.me': { paramsTuple?: []; params?: {} }
    'spaces.index': { paramsTuple?: []; params?: {} }
    'spaces.tree': { paramsTuple: [ParamValue]; params: {'spaceId': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.show': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
    'documents.update': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
    'collaboration_tokens.store': { paramsTuple?: []; params?: {} }
    'ai_editor.store': { paramsTuple?: []; params?: {} }
    'rag.search': { paramsTuple?: []; params?: {} }
    'rag.chat': { paramsTuple?: []; params?: {} }
  }
  GET: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'spaces.index': { paramsTuple?: []; params?: {} }
    'spaces.tree': { paramsTuple: [ParamValue]; params: {'spaceId': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.show': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
  }
  HEAD: {
    'auth.me': { paramsTuple?: []; params?: {} }
    'spaces.index': { paramsTuple?: []; params?: {} }
    'spaces.tree': { paramsTuple: [ParamValue]; params: {'spaceId': ParamValue} }
    'documents.index': { paramsTuple?: []; params?: {} }
    'documents.show': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
  }
  POST: {
    'auth.login': { paramsTuple?: []; params?: {} }
    'auth.logout': { paramsTuple?: []; params?: {} }
    'collaboration_tokens.store': { paramsTuple?: []; params?: {} }
    'ai_editor.store': { paramsTuple?: []; params?: {} }
    'rag.search': { paramsTuple?: []; params?: {} }
    'rag.chat': { paramsTuple?: []; params?: {} }
  }
  PATCH: {
    'documents.update': { paramsTuple: [ParamValue]; params: {'documentId': ParamValue} }
  }
}
declare module '@adonisjs/core/types/http' {
  export interface RoutesList extends ScannedRoutes {}
}