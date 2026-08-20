import { useCallback, useEffect, useState } from 'react'
import { api } from './api'

/**
 * Minimal data hook. Deliberately not React Query — one dependency less,
 * and nothing here needs cache invalidation across routes yet. If that
 * changes, swap this file and the pages don't move.
 */
export function useApi(path, { skip = false } = {}) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(!skip)

  const load = useCallback(async () => {
    if (skip || !path) return
    setLoading(true); setError(null)
    try { setData(await api(path)) }
    catch (e) { setError(e) }
    finally { setLoading(false) }
  }, [path, skip])

  useEffect(() => { load() }, [load])

  return { data, error, loading, reload: load, setData }
}
