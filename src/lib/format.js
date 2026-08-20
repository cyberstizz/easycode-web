/** Money is always integer cents on the wire. Never do math on a formatted string. */
export const money = (cents, { withCents = true } = {}) => {
  if (cents == null) return '—'
  return (cents / 100).toLocaleString('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: withCents ? 2 : 0,
    maximumFractionDigits: withCents ? 2 : 0,
  })
}

export const shortDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'

export const longDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export const dateTime = (iso) =>
  iso ? new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }) : '—'

/** "2h", "3d", "Aug 14" — for list rows where space is tight. */
export const ago = (iso) => {
  if (!iso) return ''
  const mins = Math.floor((Date.now() - new Date(iso)) / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return shortDate(iso)
}

export const daysUntil = (iso) => {
  if (!iso) return null
  return Math.ceil((new Date(iso) - new Date()) / 86400000)
}

export const initials = (name) =>
  (name || '?').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase()

export const bytes = (n) => {
  if (n == null) return '—'
  if (n < 1024) return `${n} B`
  if (n < 1048576) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / 1048576).toFixed(1)} MB`
}

export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024
export const ALLOWED_UPLOAD_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/heic',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
