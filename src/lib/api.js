import { EP } from './endpoints'
import { mockFetch, MOCK_ON } from './mock'

const BASE = import.meta.env.VITE_API_BASE_URL || ''

/** In-memory only. Never localStorage — an XSS then owns the session. */
let accessToken = null
let onUnauthorized = () => {}

export const setAccessToken = (t) => { accessToken = t }
export const getAccessToken = () => accessToken
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message || 'Something went wrong.')
    this.status = status
    this.code = code || 'INTERNAL'
    this.field = field
  }
}

/**
 * The backend may return either {error:{code,message,field}} or a bare
 * Spring problem-detail. Normalize both into ApiError so the UI has one shape.
 */
async function toApiError(res) {
  let body = null
  try { body = await res.json() } catch { /* empty or non-JSON body */ }

  if (body?.error) {
    return new ApiError(res.status, body.error.code, body.error.message, body.error.field)
  }
  const message =
    body?.message ||
    body?.detail ||
    (res.status === 401 ? 'Your session expired. Sign in again.'
      : res.status === 403 ? "You don't have access to that."
      : res.status === 404 ? "That doesn't exist, or isn't yours."
      : res.status >= 500 ? 'Something broke on our end. Not your fault.'
      : 'Request failed.')
  const code =
    res.status === 401 ? 'UNAUTHORIZED'
    : res.status === 403 ? 'FORBIDDEN'
    : res.status === 404 ? 'NOT_FOUND'
    : res.status === 429 ? 'RATE_LIMITED'
    : res.status >= 500 ? 'INTERNAL' : 'VALIDATION_FAILED'
  return new ApiError(res.status, code, message, body?.field)
}

/**
 * Single-flight refresh. If three requests 401 at once we refresh once,
 * not three times — three concurrent refreshes would rotate the cookie
 * three times and the backend treats a replayed token as a breach,
 * revoking every session for the user.
 */
let refreshInFlight = null

async function refreshAccessToken() {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await rawFetch(EP.refresh(), { method: 'POST', skipAuth: true })
        if (!res.ok) throw await toApiError(res)
        const data = await res.json()
        accessToken = data.accessToken
        return data
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

function rawFetch(path, { method = 'GET', body, headers = {}, skipAuth = false } = {}) {
  const h = { ...headers }
  if (body !== undefined && !(body instanceof FormData)) h['Content-Type'] = 'application/json'
  if (!skipAuth && accessToken) h.Authorization = `Bearer ${accessToken}`

  return fetch(BASE + path, {
    method,
    headers: h,
    // Required: the refresh token is an httpOnly cookie.
    credentials: 'include',
    body: body === undefined ? undefined
      : body instanceof FormData ? body
      : JSON.stringify(body),
  })
}

/**
 * The one function everything goes through.
 * Retries exactly once after a successful refresh, then gives up.
 */
export async function api(path, opts = {}) {
  if (MOCK_ON) return mockFetch(path, opts)

  let res = await rawFetch(path, opts)

  if (res.status === 401 && !opts.skipAuth && !opts.__retried) {
    try {
      await refreshAccessToken()
      res = await rawFetch(path, { ...opts, __retried: true })
    } catch {
      accessToken = null
      onUnauthorized()
      throw new ApiError(401, 'UNAUTHORIZED', 'Your session expired. Sign in again.')
    }
  }

  if (!res.ok) throw await toApiError(res)
  if (res.status === 204) return null

  const type = res.headers.get('content-type') || ''
  return type.includes('application/json') ? res.json() : res.text()
}

export const get = (p) => api(p)
export const post = (p, body) => api(p, { method: 'POST', body })
export const patch = (p, body) => api(p, { method: 'PATCH', body })
export const del = (p) => api(p, { method: 'DELETE' })

/**
 * Direct-to-R2 upload. Deliberately NOT routed through `api()` —
 * it must not carry our Authorization header or our cookies to
 * Cloudflare, and the presigned URL is already the credential.
 */
export async function putToR2(uploadUrl, file) {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
  })
  if (!res.ok) throw new ApiError(res.status, 'UPLOAD_FAILED', 'That upload didn\'t finish. Try again.')
  return true
}
