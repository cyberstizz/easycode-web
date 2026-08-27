import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import './styles/app.css'

/**
 * Collapse duplicate slashes in the path before the router mounts.
 *
 * A misconfigured base URL produces links like `/​/accept-invite?token=…`, and
 * React Router does not treat `//accept-invite` as `/accept-invite` — it falls
 * through to the 404. Rewriting here keeps every already-sent invite working,
 * regardless of what generated the link.
 */
const { pathname, search, hash } = window.location
if (pathname.includes('//')) {
  window.history.replaceState(null, '', pathname.replace(/\/{2,}/g, '/') + search + hash)
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)