import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api, post, setAccessToken, setUnauthorizedHandler } from '../lib/api'
import { EP, isStaff, isOwner } from '../lib/endpoints'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [org, setOrg] = useState(null)
  const [booting, setBooting] = useState(true)

  /**
   * On mount, try one silent refresh. The access token lives in memory only,
   * so a page reload always starts with nothing — the httpOnly cookie is what
   * carries the session across reloads.
   */
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await api(EP.refresh(), { method: 'POST', skipAuth: true })
        if (cancelled) return
        setAccessToken(data.accessToken)
        const me = data.user ? { user: data.user } : await api(EP.me())
        setUser(me.user || data.user)
        setOrg(me.org || null)
      } catch {
        // No valid cookie. Not an error — just a signed-out visitor.
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const signOut = useCallback(async () => {
    try { await post(EP.logout()) } catch { /* already gone */ }
    setAccessToken(null); setUser(null); setOrg(null)
  }, [])

  useEffect(() => {
    setUnauthorizedHandler(() => { setUser(null); setOrg(null) })
  }, [])

  const signIn = useCallback(async (email, password) => {
    const data = await post(EP.login(), { email, password })
    setAccessToken(data.accessToken)
    setUser(data.user)
    setOrg(data.org || null)
    return data.user
  }, [])

  const acceptInvite = useCallback(async (token, password, name) => {
    const data = await post(EP.inviteAccept(), { token, password, name })
    setAccessToken(data.accessToken)
    setUser(data.user)
    return data.user
  }, [])

  const value = {
    user, org, booting, signIn, signOut, acceptInvite,
    isStaff: isStaff(user?.role),
    isOwner: isOwner(user?.role),
  }
  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export const useAuth = () => {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
