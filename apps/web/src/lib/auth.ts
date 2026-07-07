export type AuthSession = {
  token: string | null
}

const AUTH_TOKEN_KEY = 'docweave.auth.token'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

export function getAccessToken() {
  if (!canUseStorage()) {
    return null
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}

export function hasAccessToken() {
  return Boolean(getAccessToken())
}

export function saveAccessToken(token: string) {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token)
}

export function clearAccessToken() {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY)
}

export function readAuthSession(): AuthSession {
  return {
    token: getAccessToken(),
  }
}
