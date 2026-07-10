export type ApiSuccessResponse<T> = {
  data: T
}

export type ApiErrorItem = {
  field?: string
  message?: string
}

export type ApiErrorResponse = {
  message?: string
  errors?: ApiErrorItem[]
}

export type ApiMessageResponse = {
  message: string
}
