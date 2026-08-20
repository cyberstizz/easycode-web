import { initials } from '../lib/format'

const TONES = ['', 'cool', 'warm']

/** Deterministic tone per name so the same person is the same color everywhere. */
export default function Avatar({ name, size = '', tone }) {
  const t = tone ?? TONES[[...(name || '?')].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length]
  return <div className={`av ${size} ${t}`.trim()}>{initials(name)}</div>
}
