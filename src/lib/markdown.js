import { Fragment } from 'react'

/**
 * Renders a stage update as readable writing.
 *
 * Deliberately small. It builds React elements from a handful of Markdown
 * conventions and never touches innerHTML, so nothing a client pastes into a
 * reply can become markup. Supported:
 *
 *   # Heading / ## Heading / ### Heading   → a section heading
 *   - item  /  * item                      → bullet list
 *   1. item                                → numbered list
 *   ! text                                 → the amber "Waiting on you" block
 *   **bold**  *italic*  `code`
 *   [label](https://…)  and bare https:// links
 *   blank line                             → paragraph break
 *
 * Anything else is a paragraph. That's the whole grammar, and it's enough to
 * write an update someone can actually follow on a phone.
 */

const URL_RE = /(https?:\/\/[^\s<>)]+)/g

function inline(text, keyBase) {
  // Tokenise on links and code first so their contents are left alone.
  const parts = []
  let rest = text
  let i = 0
  const push = (node) => parts.push(<Fragment key={`${keyBase}-${i++}`}>{node}</Fragment>)

  while (rest.length) {
    const link = rest.match(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/)
    const code = rest.match(/`([^`]+)`/)
    const bold = rest.match(/\*\*([^*]+)\*\*/)
    const em = rest.match(/(^|[^*])\*([^*\n]+)\*(?!\*)/)
    const bare = rest.match(URL_RE)

    const cands = [
      link && { at: link.index, len: link[0].length, node: <a href={link[2]} target="_blank" rel="noreferrer">{link[1]}</a> },
      code && { at: code.index, len: code[0].length, node: <code>{code[1]}</code> },
      bold && { at: bold.index, len: bold[0].length, node: <strong>{bold[1]}</strong> },
      em && { at: em.index + em[1].length, len: em[0].length - em[1].length, node: <em>{em[2]}</em> },
      bare && { at: bare.index, len: bare[0].length, node: <a href={bare[0]} target="_blank" rel="noreferrer">{bare[0]}</a> },
    ].filter(Boolean).sort((a, b) => a.at - b.at)

    if (!cands.length) { push(rest); break }
    const c = cands[0]
    if (c.at > 0) push(rest.slice(0, c.at))
    push(c.node)
    rest = rest.slice(c.at + c.len)
  }
  return parts
}

export function renderMarkdown(src) {
  if (!src || !src.trim()) return null
  const lines = src.replace(/\r\n?/g, '\n').split('\n')
  const out = []
  let para = []
  let list = null // { type: 'ul' | 'ol', items: [] }
  let k = 0

  const flushPara = () => {
    if (para.length) { out.push(<p key={k++}>{inline(para.join(' '), k)}</p>); para = [] }
  }
  const flushList = () => {
    if (list) {
      const Tag = list.type
      out.push(<Tag key={k++}>{list.items.map((t, i) => <li key={i}>{inline(t, `${k}-${i}`)}</li>)}</Tag>)
      list = null
    }
  }

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) { flushPara(); flushList(); continue }

    const h = line.match(/^#{1,3}\s+(.*)$/)
    if (h) { flushPara(); flushList(); out.push(<h3 key={k++}>{inline(h[1], k)}</h3>); continue }

    const ask = line.match(/^!\s+(.*)$/)
    if (ask) { flushPara(); flushList(); out.push(<div key={k++} className="ask"><b>Waiting on you</b> — {inline(ask[1], k)}</div>); continue }

    const ul = line.match(/^[-*]\s+(.*)$/)
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ul || ol) {
      flushPara()
      const type = ul ? 'ul' : 'ol'
      if (!list || list.type !== type) { flushList(); list = { type, items: [] } }
      list.items.push((ul || ol)[1])
      continue
    }

    flushList()
    para.push(line.trim())
  }
  flushPara(); flushList()
  return out
}

/** The asks in an update, for the "needs you" banner. */
export function extractAsks(src) {
  if (!src) return []
  return src.split('\n').map((l) => l.match(/^!\s+(.*)$/)?.[1]).filter(Boolean)
}

/** First sentence-ish, for collapsed past stages. */
export function firstLine(src, max = 140) {
  if (!src) return ''
  const t = src.split('\n').map((l) => l.replace(/^[#!*\-\d.)\s]+/, '').trim()).find(Boolean) || ''
  return t.length > max ? t.slice(0, max - 1) + '…' : t
}

export default function Prose({ source, className = '' }) {
  return <div className={`prose ${className}`.trim()}>{renderMarkdown(source)}</div>
}