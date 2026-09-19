/**
 * THE SEAM.
 *
 * Every path this frontend knows about lives here and nowhere else.
 * No component, page, or hook should ever contain a URL string.
 *
 * These paths were read off the actual easycode-api repo (README + API_EXAMPLES.md),
 * NOT off the original frozen contract — the two diverged. When the backend moves a
 * path or renames a field, you fix it here and the app keeps working.
 *
 * Backend conventions confirmed from the repo:
 *   - JSON is camelCase (dealTier, amountCents, accessToken)
 *   - Access token in `Authorization: Bearer`
 *   - Refresh token is an httpOnly rotating cookie -> requests need credentials:'include'
 *   - Deal tiers: STANDARD | PREFERRED | FLOOR | SPECIAL
 *       STANDARD  = $600 down (50% of $1,200), $50/mo optional
 *       PREFERRED = $200 down + $50/mo, 24-month contract
 *       FLOOR     = $100 down + $50/mo, 24-month contract   (owner-only)
 *       SPECIAL   = comp / favor / referral trade            (owner-only)
 */

export const EP = {
  // ── public ────────────────────────────────────────────────
  health: () => '/v1/public/health',
  contact: () => '/v1/public/contact',

  // ── auth ──────────────────────────────────────────────────
  login: () => '/v1/auth/login',
  refresh: () => '/v1/auth/refresh',
  logout: () => '/v1/auth/logout',
  me: () => '/v1/auth/me',
  inviteLookup: (token) => `/v1/auth/invites/${encodeURIComponent(token)}`,
  inviteAccept: () => '/v1/auth/invites/accept',
  passwordForgot: () => '/v1/auth/password/forgot',
  passwordReset: () => '/v1/auth/password/reset',

  // ── client portal ─────────────────────────────────────────
  portalHome: () => '/v1/portal/home',

  projects: () => '/v1/projects',
  project: (id) => `/v1/projects/${id}`,

  requests: () => '/v1/requests',
  request: (id) => `/v1/requests/${id}`,
  requestMessages: (id) => `/v1/requests/${id}/messages`,
  requestRead: (id) => `/v1/requests/${id}/read`,
  requestChangeOrders: (id) => `/v1/requests/${id}/change-orders`,
  changeOrderApprove: (id) => `/v1/change-orders/${id}/approve`,
  changeOrderDecline: (id) => `/v1/change-orders/${id}/decline`,

  assets: (params = '') => `/v1/assets${params}`,
  assetPresign: () => '/v1/assets/presign',
  assetComplete: (id) => `/v1/assets/${id}/complete`,
  assetUrl: (id) => `/v1/assets/${id}/url`,

  billingSummary: () => '/v1/billing/summary',
  invoice: (id) => `/v1/invoices/${id}`,
  invoicePaymentIntent: (id) => `/v1/invoices/${id}/payment-intent`,
  setupIntent: () => '/v1/billing/setup-intent',
  billingCard: () => '/v1/billing/card',
  plans: () => '/v1/plans',
  subscriptions: () => '/v1/subscriptions',

  // ── admin ─────────────────────────────────────────────────
  adminDashboard: () => '/v1/admin/dashboard',

  // Staff see the same /v1/requests collection the client does — the backend
  // widens the result set by role rather than exposing a separate path.
  adminRequests: () => '/v1/requests',
  adminAsset: (id) => `/v1/assets/${id}`,

  adminOrgs: () => '/v1/admin/organizations',
  adminOrg: (id) => `/v1/admin/organizations/${id}`,
  adminOrgContacts: (orgId) => `/v1/admin/organizations/${orgId}/contacts`,
  adminContactInvite: (contactId) =>
    `/v1/admin/organizations/contacts/${contactId}/invite`,

  // Maintenance. The /admin paths carry due dates; the portal path never does.
  maintenanceBoard: (horizon = 14) => `/v1/admin/maintenance?horizon=${horizon}`,
  projectMaintenance: (projectId) => `/v1/admin/projects/${projectId}/maintenance`,
  completeVisit: (visitId) => `/v1/admin/maintenance/visits/${visitId}/complete`,
  maintenanceReports: (projectId) => `/v1/projects/${projectId}/maintenance-reports`,

  // Internal delivery checklist. Staff-only — there is no portal equivalent.
  projectChecklist: (projectId) => `/v1/admin/projects/${projectId}/checklist`,
  checklistItem: (itemId) => `/v1/admin/checklist-items/${itemId}`,
  checklistTemplates: () => '/v1/admin/checklist-templates',

  // The thread under a stage update. Both sides read and write it.
  stageMessages: (projectId, stageKey) => `/v1/projects/${projectId}/stages/${stageKey}/messages`,

  // Deleting a client. The preview feeds the confirmation dialog's numbers; the
  // delete is a POST because it carries a body (password + retyped name) and a
  // DELETE-with-body has to survive the Netlify proxy hop.
  adminOrgDeletionPreview: (id) => `/v1/admin/organizations/${id}/deletion-preview`,
  adminOrgDelete: (id) => `/v1/admin/organizations/${id}/delete`,

  // NOTE: /v1/admin/projects is POST-only. Listing goes through /v1/projects,
  // which already returns every project for staff and filters by org for clients.
  adminProjects: () => '/v1/admin/projects',
  adminProject: (id) => `/v1/admin/projects/${id}`,
  projectsForOrg: (orgId) => `/v1/projects?orgId=${orgId}`,
  adminProjectStage: (projectId, stageKey) =>
    `/v1/admin/projects/${projectId}/stages/${stageKey}`,
  adminProjectAdvance: (projectId) => `/v1/admin/projects/${projectId}/advance`,

  adminInvoices: (orgId) => `/v1/admin/invoices${orgId ? `?orgId=${orgId}` : ''}`,
  adminInvoiceSend: (id) => `/v1/admin/invoices/${id}/send`,
  adminInvoiceVoid: (id) => `/v1/admin/invoices/${id}/void`,

  adminLeads: () => '/v1/admin/leads',
  adminLeadsBoard: () => '/v1/admin/leads/board',
  adminLeadsDue: () => '/v1/admin/leads/due',
  adminLead: (id) => `/v1/admin/leads/${id}`,
  adminLeadActivities: (id) => `/v1/admin/leads/${id}/activities`,
  adminLeadConvert: (id) => `/v1/admin/leads/${id}/convert`,
}

/** Ordered stage keys. The backend's StageKey enum — do not reorder. */
/**
 * Backend enum values, verified against com.easycode.api.domain.enums.
 * The live stage is ACTIVE, not IN_PROGRESS — IN_PROGRESS belongs to
 * RequestStatus and sending it to a stage endpoint is a 500.
 */
export const STAGE_STATUS = {
  PENDING: 'PENDING', ACTIVE: 'ACTIVE', BLOCKED: 'BLOCKED', COMPLETE: 'COMPLETE',
}
export const CHANGE_ORDER_STATUS = {
  PROPOSED: 'PROPOSED', APPROVED: 'APPROVED', DECLINED: 'DECLINED', CANCELLED: 'CANCELLED',
}
export const INVOICE_STATUS = {
  DRAFT: 'DRAFT', OPEN: 'OPEN', PAID: 'PAID', VOID: 'VOID', UNCOLLECTIBLE: 'UNCOLLECTIBLE',
}

export const STAGES = [
  'DISCOVERY',
  'DESIGN',
  'DEVELOPMENT',
  'REVIEW',
  'LAUNCH',
  'MAINTENANCE',
]

export const STAGE_META = {
  DISCOVERY: { n: '01', label: 'Discovery', color: 'var(--violet)' },
  DESIGN: { n: '02', label: 'Design', color: 'var(--blue)' },
  DEVELOPMENT: { n: '03', label: 'Development', color: 'var(--cyan)' },
  REVIEW: { n: '04', label: 'Review', color: 'var(--amber)' },
  LAUNCH: { n: '05', label: 'Launch', color: 'var(--em)' },
  MAINTENANCE: { n: '06', label: 'Maintenance', color: 'var(--teal)' },
}

export const DEAL_TIER = {
  STANDARD: { label: 'Standard', down: 60000, monthly: 5000, months: 0 },
  PREFERRED: { label: 'Preferred', down: 20000, monthly: 5000, months: 24 },
  FLOOR: { label: 'Floor', down: 10000, monthly: 5000, months: 24, ownerOnly: true },
  SPECIAL: { label: 'Special', down: 0, monthly: 0, months: 0, ownerOnly: true },
}

/** Request statuses, in queue order. */
export const REQUEST_STATUS = {
  NEW: { label: 'New', chip: 'c-new' },
  ACKNOWLEDGED: { label: 'Seen', chip: 'c-done' },
  IN_PROGRESS: { label: 'In progress', chip: 'c-prog' },
  NEEDS_CLIENT: { label: 'Needs you', chip: 'c-you' },
  DONE: { label: 'Done', chip: 'c-done' },
  DECLINED: { label: 'Declined', chip: 'c-done' },
}

export const REQUEST_TYPE = {
  UPDATE: { label: 'Update', chip: 'c-vio' },
  QUESTION: { label: 'Question', chip: 'c-blu' },
  NEW_PROJECT: { label: 'New project', chip: 'c-new' },
  BUG: { label: 'Bug', chip: 'c-late' },
}

export const BILLING_DISPOSITION = {
  UNSET: 'Not set',
  INCLUDED: 'Included in plan',
  BILLABLE: 'Billable',
  DECLINED: 'Declined',
}

/** Who the client is talking to. One place to change when agents start posting. */
export const DEVELOPER_NAME = 'Charles'

/** Roles. The backend bootstraps an ADMIN; CLIENT is the portal role. */
export const ROLE = { CLIENT: 'CLIENT', AGENT: 'AGENT', PM: 'PM', ADMIN: 'ADMIN', OWNER: 'OWNER' }
export const STAFF_ROLES = [ROLE.AGENT, ROLE.PM, ROLE.ADMIN, ROLE.OWNER]
export const isStaff = (role) => STAFF_ROLES.includes(role)
export const isOwner = (role) => role === ROLE.ADMIN || role === ROLE.OWNER


/** Pipeline columns, left to right. Matches the backend's LeadStatus enum. */
export const LEAD_STATUS = [
  { key: 'NEW',         label: 'New',         accent: 'var(--mute)' },
  { key: 'CONTACTED',   label: 'Contacted',   accent: 'var(--mute)' },
  { key: 'PITCHED',     label: 'Pitched',     accent: 'var(--cyan)' },
  { key: 'NEGOTIATING', label: 'Negotiating', accent: 'var(--amber)' },
  { key: 'WON',         label: 'Won',         accent: 'var(--em-hi)' },
]

export const LEAD_SOURCE = {
  COLD_CALL:    { label: 'Cold call',    chip: 'c-blu' },
  WEBSITE_FORM: { label: 'Inbound',      chip: 'c-new' },
  REFERRAL:     { label: 'Referral',     chip: 'c-vio' },
  WALK_IN:      { label: 'Walk-in',      chip: 'c-done' },
  OTHER:        { label: 'Other',        chip: 'c-done' },
}

/** Call dispositions. Matches the backend's ActivityOutcome enum. */
export const CALL_OUTCOME = [
  { key: 'CONNECTED',      label: 'Connected', good: true },
  { key: 'VOICEMAIL',      label: 'Voicemail' },
  { key: 'NO_ANSWER',      label: 'No answer' },
  { key: 'BAD_NUMBER',     label: 'Bad number' },
  { key: 'NOT_INTERESTED', label: 'Not interested' },
]

/**
 * Tap-to-tag instead of free text. The whole point: after fifty calls these
 * aggregate into "where deals die", which free-text notes never can.
 */
export const OBJECTION_TAGS = [
  'Trust', 'Cash flow', 'Timing', 'Needs a partner', 'Happy as is', 'Price',
]

/** Offer ladder. FLOOR and SPECIAL are owner-only — the backend enforces it too. */
export const RUNGS = [
  { key: 'NONE',      label: 'Nothing yet', down: null,  monthly: null, months: 0 },
  { key: 'STANDARD',  label: 'Standard',    down: 60000, monthly: 5000, months: 0,  note: '50% of $1,200, no contract' },
  { key: 'PREFERRED', label: 'Preferred',   down: 20000, monthly: 5000, months: 24, note: '2-year contract, $50/mo' },
  { key: 'FLOOR',     label: 'Floor',       down: 10000, monthly: 5000, months: 24, note: '2-year contract, $50/mo', ownerOnly: true },
  { key: 'SPECIAL',   label: 'Special',     down: 0,     monthly: 0,    months: 0,  note: 'Favor or referral trade', ownerOnly: true },
]

export const rung = (key) => RUNGS.find((r) => r.key === key) || RUNGS[0]

/** Two-year value of a deal. Preferred beats Standard — worth surfacing in the UI. */
export const twoYearValueCents = (key) => {
  const r = rung(key)
  if (!r.down && !r.monthly) return 0
  return r.months ? r.down + r.monthly * r.months : 120000
}


/* ════════════════════════════════════════════════════════════════════
   ADAPTERS

   The API's envelopes differ per endpoint. Rather than teach every page
   about that, unwrap here — one place to change if the backend moves.
   ════════════════════════════════════════════════════════════════════ */

/** GET /v1/admin/leads/board -> {columns:{STATUS:[...]}, stats} */
export const adaptBoard = (raw) => ({
  items: Object.values(raw?.columns || {}).flat(),
  columns: raw?.columns || {},
  stats: raw?.stats || {},
})

/** GET /v1/admin/leads/due -> {items, stats} */
export const adaptDue = (raw) => ({
  items: raw?.items || [],
  stats: raw?.stats || {},
})

/** GET /v1/admin/leads/{id} -> {lead, activities} — flattened for the page. */
export const adaptLead = (raw) => {
  if (!raw) return null
  const lead = raw.lead || raw
  return { ...lead, activities: raw.activities || [] }
}

/** POST /v1/admin/leads/{id}/convert -> {organization, contact, project} */
export const adaptConvert = (raw) => ({
  org: raw?.organization,
  contact: raw?.contact,
  project: raw?.project,
  // Present only while email sending is off — that's when you have to deliver
  // the link by hand.
  acceptUrl: raw?.acceptUrl,
  inviteEmail: raw?.inviteEmail,
  inviteExpiresAt: raw?.inviteExpiresAt,
  emailSent: raw?.emailSent,
})


/** GET /v1/assets -> a bare array. Normalise so pages read `.items` like everywhere else. */
export const adaptAssets = (raw) => ({ items: Array.isArray(raw) ? raw : (raw?.items || []) })

/** The backend stores CLIENT | INTERNAL. Only the first is ever shown to a client. */
export const VISIBILITY = { CLIENT: 'CLIENT', INTERNAL: 'INTERNAL' }

export const isImage = (mime) => (mime || '').startsWith('image/')


/** Several list endpoints return a bare array. Normalise to `.items`. */
export const adaptList = (raw) => ({ items: Array.isArray(raw) ? raw : (raw?.items || []) })

/**
 * StageView serialises its stage identifier as `key`, not `stageKey`:
 *
 *     public record StageView(UUID id, StageKey key, String label, ...)
 *
 * Every page in this app reads `s.stageKey`. Unnormalised, that is undefined
 * on every stage object, which silently breaks three separate things: the
 * editor can't find the active stage so its form never loads saved values,
 * `Object.fromEntries` collapses all six stages onto a single `undefined`
 * key so every rail renders PENDING, and the optimistic update after a save
 * never matches a row. The save itself was always reaching the database.
 *
 * Normalised here rather than at nine call sites. `key` is kept alongside so
 * nothing that already reads it breaks.
 */
const withStageKey = (s) => (s && s.stageKey === undefined ? { ...s, stageKey: s.key } : s)

const normalizeProject = (p) =>
  !p ? p : { ...p, stages: Array.isArray(p.stages) ? p.stages.map(withStageKey) : (p.stages || []) }

/** GET /v1/projects/{id} — one project with its six stages. */
export const adaptProject = (raw) => normalizeProject(raw)

/** GET /v1/projects — bare array or {items}; normalise both, stages included. */
export const adaptProjects = (raw) => ({
  items: (Array.isArray(raw) ? raw : (raw?.items || [])).map(normalizeProject),
})

/**
 * RequestView has no `refNumber` — not in the DTO, not in V1__init.sql. The UI
 * shows one in eleven places and portal search called .toLowerCase() on it,
 * which threw the moment anyone typed in that box.
 *
 * Derived from the id so it is stable across reloads and readable on a phone
 * call ("that's request 3F9A2C"). Swap this for a real sequential column when
 * there's a migration to spare; the display contract stays the same.
 */
const withRefNumber = (r) =>
  !r || r.refNumber ? r : { ...r, refNumber: 'REQ-' + String(r.id || '').replace(/-/g, '').slice(0, 6).toUpperCase() }

export const adaptRequest = (raw) => withRefNumber(raw)

export const adaptRequests = (raw) => ({
  items: (Array.isArray(raw) ? raw : (raw?.items || [])).map(withRefNumber),
})

/** Backend enums for billing, verified against com.easycode.api.domain.enums. */
export const INVOICE_KIND = {
  DEPOSIT: 'DEPOSIT', MILESTONE: 'MILESTONE', CHANGE_ORDER: 'CHANGE_ORDER',
  SUBSCRIPTION: 'SUBSCRIPTION', ONE_OFF: 'ONE_OFF',
}
export const INVOICE_KIND_LABEL = {
  DEPOSIT: 'Deposit', MILESTONE: 'Milestone', CHANGE_ORDER: 'Change order',
  SUBSCRIPTION: 'Maintenance', ONE_OFF: 'One-off',
}
export const SUBSCRIPTION_STATUS = {
  INCOMPLETE: 'INCOMPLETE', ACTIVE: 'ACTIVE', PAST_DUE: 'PAST_DUE',
  CANCELED: 'CANCELED', UNPAID: 'UNPAID', TRIALING: 'TRIALING',
}

/** Chip tone for an invoice status — one place, so every list agrees. */
export const invoiceTone = (status, dueAt) => {
  if (status === 'PAID') return 'c-new'
  if (status === 'VOID' || status === 'UNCOLLECTIBLE') return 'c-done'
  if (status === 'DRAFT') return 'c-done'
  if (dueAt && new Date(dueAt) < new Date()) return 'c-late'
  return 'c-you'
}
export const invoiceLabel = (status, dueAt) => {
  if (status === 'PAID') return 'Paid'
  if (status === 'VOID') return 'Void'
  if (status === 'UNCOLLECTIBLE') return 'Written off'
  if (status === 'DRAFT') return 'Draft'
  if (dueAt && new Date(dueAt) < new Date()) return 'Overdue'
  return 'Due'
}

/**
 * InvoiceView — amountCents / amountPaidCents / balanceCents / memo / dueAt.
 * Not totalCents, not description, not dueOn. The handoff warned about exactly
 * this trio, so the adapter also derives the fields the older pages read.
 */
export const adaptInvoice = (raw) => !raw ? raw : ({
  ...raw,
  lines: Array.isArray(raw.lines) ? raw.lines : [],
  // Derived, for anything still reading the old names:
  totalCents: raw.amountCents,
  description: raw.memo,
  dueOn: raw.dueAt,
  payable: raw.status === 'OPEN' && (raw.balanceCents ?? 0) > 0,
})

/** GET /v1/billing/summary — {amountDueCents, invoices[], subscriptions[], plans[]}. */
export const adaptBillingSummary = (raw) => ({
  amountDueCents: raw?.amountDueCents ?? 0,
  invoices: (raw?.invoices || []).map(adaptInvoice),
  subscriptions: raw?.subscriptions || [],
  plans: raw?.plans || [],
  activeSubscription: (raw?.subscriptions || []).find((s) =>
    ['ACTIVE', 'TRIALING', 'PAST_DUE'].includes(s.status)) || null,
})

/** POST /v1/invoices/{id}/payment-intent — {clientSecret, intentId, amountCents}. */
export const adaptIntent = (raw) => ({
  clientSecret: raw?.clientSecret || null,
  intentId: raw?.intentId || null,
  amountCents: raw?.amountCents ?? 0,
})

/** GET /v1/billing/card — {card: {brand,last4,expMonth,expYear} | null}. */
export const adaptCard = (raw) => raw?.card || null

/**
 * GET /v1/admin/maintenance — the week board.
 *
 * Buckets come from the server already sorted; the adapter only guarantees the
 * arrays exist so the page can map without guarding every one. `dueOn` is a
 * plain YYYY-MM-DD date, not an Instant — don't run it through new Date()
 * without a time, or a US timezone shifts it to the previous day.
 */
export const adaptMaintenanceBoard = (raw) => ({
  today: raw?.today || null,
  overdue: raw?.overdue || [],
  dueToday: raw?.dueToday || [],
  thisWeek: raw?.thisWeek || [],
  later: raw?.later || [],
  activeSchedules: raw?.activeSchedules ?? 0,
  get openCount() {
    return this.overdue.length + this.dueToday.length + this.thisWeek.length
  },
})

/** A YYYY-MM-DD from the server, rendered without timezone drift. */
export const dayLabel = (ymd, opts = { month: 'short', day: 'numeric' }) => {
  if (!ymd) return '—'
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', opts)
}
export const dayOfWeek = (ymd) => {
  if (!ymd) return ''
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' })
}

/** GET /v1/admin/projects/{id}/maintenance — {schedule, open, history[]}. */
export const adaptProjectMaintenance = (raw) => ({
  schedule: raw?.schedule || null,
  open: raw?.open || null,
  history: raw?.history || [],
})

/** GET /v1/projects/{id}/maintenance-reports — completed only, no due dates. */
export const adaptMaintenanceReports = (raw) => (Array.isArray(raw?.items) ? raw.items : [])

/** GET /v1/admin/projects/{id}/checklist — {items[], stages[], done, total}. */
export const adaptChecklist = (raw) => ({
  items: Array.isArray(raw?.items) ? raw.items : [],
  stages: Array.isArray(raw?.stages) ? raw.stages : [],
  done: raw?.done ?? 0,
  total: raw?.total ?? 0,
})

/** GET /v1/projects/{id}/stages/{key}/messages — {stageId, items[], clientLastReadAt}. */
export const adaptThread = (raw) => ({
  stageId: raw?.stageId ?? null,
  items: Array.isArray(raw?.items) ? raw.items : [],
  clientLastReadAt: raw?.clientLastReadAt ?? null,
})

/**
 * GET /v1/portal/home.
 *
 * DashboardController.portalHome() returns:
 *   { openRequests, unreadReplies, amountDueCents, projects[],
 *     recentRequests[], recentFiles[], openInvoices[] }
 *
 * portal/Overview.jsx was written against a completely different contract:
 *   { user, activeProject, needsYou[], balanceDueCents, nextInvoice, recentActivity[] }
 *
 * Not one of those six names is sent by the API. Every one resolved to
 * undefined, which is why the page rendered "Good morning, ." with an empty
 * tracker and a balance of ".NaN" — `undefined % 100` is NaN, printed straight
 * into the markup.
 *
 * Mapped here rather than rewriting the page against raw field names, so the
 * page keeps one shape whatever the endpoint does later.
 *
 * NOTE: `projects` here comes from ProjectView.summary(), which passes
 * List.of() for stages — the portal home response carries NO stage data at
 * all. The tracker has to come from GET /v1/projects/{id}. Overview fetches
 * that separately; this adapter cannot invent it.
 */
export const adaptPortalHome = (raw) => {
  if (!raw) return raw

  const projects = (raw.projects || []).map(normalizeProject)
  const invoices = raw.openInvoices || []
  const inv = invoices[0]

  // Requests parked on the client are the "needs you" cards.
  const needsYou = (raw.recentRequests || [])
    .filter((r) => r.status === 'NEEDS_CLIENT')
    .map((r) => ({
      kind: 'REQUEST',
      requestId: r.id,
      refNumber: withRefNumber(r).refNumber,
      title: r.title,
      body: '',
      askedAt: r.updatedAt || r.createdAt,
    }))

  // No activity feed endpoint exists. Build one from what is actually sent.
  const recentActivity = [
    ...(raw.recentRequests || []).map((r) => ({
      id: `req-${r.id}`,
      actorName: r.orgName || 'You',
      body: `opened ${r.title}`,
      at: r.createdAt,
    })),
    ...(raw.recentFiles || []).map((f) => ({
      id: `file-${f.id}`,
      actorName: 'EasyCode',
      body: `uploaded ${f.filename}`,
      at: f.createdAt,
    })),
  ]
    .filter((a) => a.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))
    .slice(0, 6)

  return {
    ...raw,
    activeProject: projects[0] || null,
    balanceDueCents: raw.amountDueCents ?? 0,
    // InvoiceView is amountCents / memo / dueAt — not totalCents / description / dueOn.
    nextInvoice: inv
      ? { id: inv.id, number: inv.number, description: inv.memo || 'Invoice',
          dueOn: inv.dueAt, amountCents: inv.amountCents }
      : null,
    needsYou,
    recentActivity,
  }
}