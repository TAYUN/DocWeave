import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'

type ErrorBody = {
  message: string
  errors?: Array<{
    field?: string
    rule?: string
    message: string
  }>
}

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (shouldSendJson(ctx)) {
      const status = getErrorStatus(error)
      const errors = extractValidationErrors(error)
      const message = getErrorMessage(error, status, errors)

      return ctx.response.status(status).send(
        errors.length > 0
          ? {
              message,
              errors,
            } satisfies ErrorBody
          : {
              message,
            } satisfies ErrorBody,
      )
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}

function shouldSendJson(ctx: HttpContext) {
  const accepted = ctx.request.accepts(['json', 'html'])
  return ctx.request.url().startsWith('/api') || accepted === 'json'
}

function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error) {
    const candidate = 'status' in error ? error.status : 'statusCode' in error ? error.statusCode : null

    if (typeof candidate === 'number' && candidate >= 400 && candidate <= 599) {
      return candidate
    }
  }

  return 500
}

function getErrorMessage(
  error: unknown,
  status: number,
  errors: ErrorBody['errors'] = [],
) {
  const response = getObjectValue(error, 'response')
  const payloadMessage = getObjectValue(response, 'message')

  if (typeof payloadMessage === 'string' && payloadMessage.length > 0) {
    return payloadMessage
  }

  const errorMessage = typeof getObjectValue(error, 'message') === 'string'
    ? (getObjectValue(error, 'message') as string)
    : null

  if (status === 422 && errors.length > 0) {
    return 'Validation failed'
  }

  if (errorMessage) {
    return errorMessage
  }

  switch (status) {
    case 401:
      return 'Unauthorized'
    case 403:
      return 'Forbidden'
    case 404:
      return 'Not found'
    default:
      return 'Internal server error'
  }
}

function extractValidationErrors(error: unknown): NonNullable<ErrorBody['errors']> {
  const response = getObjectValue(error, 'response')
  const sources = [
    getArrayValue(response, 'errors'),
    getArrayValue(getObjectValue(error, 'messages'), 'errors'),
    getArrayValue(error, 'messages'),
    getArrayValue(error, 'errors'),
  ]

  for (const source of sources) {
    if (!source) {
      continue
    }

    const issues = source
      .map((issue) => normalizeValidationIssue(issue))
      .filter((issue): issue is NonNullable<ReturnType<typeof normalizeValidationIssue>> => issue !== null)

    if (issues.length > 0) {
      return issues
    }
  }

  return []
}

function normalizeValidationIssue(issue: unknown) {
  if (typeof issue === 'string') {
    return {
      message: issue,
    }
  }

  if (typeof issue !== 'object' || !issue) {
    return null
  }

  const message = getObjectValue(issue, 'message')

  if (typeof message !== 'string' || message.length === 0) {
    return null
  }

  const field = getObjectValue(issue, 'field')
  const rule = getObjectValue(issue, 'rule')

  return {
    message,
    field: typeof field === 'string' ? field : undefined,
    rule: typeof rule === 'string' ? rule : undefined,
  }
}

function getObjectValue(value: unknown, key: string) {
  if (typeof value !== 'object' || !value || !(key in value)) {
    return null
  }

  return (value as Record<string, unknown>)[key]
}

function getArrayValue(value: unknown, key: string) {
  const candidate = getObjectValue(value, key)
  return Array.isArray(candidate) ? candidate : null
}
