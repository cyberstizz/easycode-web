/**
 * Mock adapter.
 *
 * Set VITE_USE_MOCK=1 and the whole app runs with no backend at all — same
 * shapes the real API returns, so switching over is one env var and zero
 * component changes. Delete this file when the API is stable; nothing
 * imports it except api.js.
 */

export const MOCK_ON = import.meta.env.VITE_USE_MOCK === '1'

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms))

const CLIENT_USER = {
  id: 'u-marcus', name: 'Marcus Terrell', email: 'marcus@hsk.com',
  role: 'CLIENT', orgId: 'org-hsk', orgName: 'Harlem Soul Kitchen', roleTitle: 'Owner',
}
const ADMIN_USER = {
  id: 'u-charles', name: 'Charles Lamb', email: 'charles@easycode.dev',
  role: 'ADMIN', orgId: null,
}

const iso = (daysAgo, h = 10) => {
  const d = new Date(); d.setDate(d.getDate() - daysAgo); d.setHours(h, 12, 0, 0)
  return d.toISOString()
}
const future = (days) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString() }

const PROJECT = {
  id: 'p-hsk', orgId: 'org-hsk', name: 'Harlem Soul Kitchen — main site',
  projectType: 'Restaurant website', status: 'ACTIVE',
  currentStage: 'DEVELOPMENT', startedOn: iso(188), estLaunchOn: future(48),
  previewUrl: 'https://hsk-preview.easycode.dev', liveUrl: null,
  stages: [
    { stageKey: 'DISCOVERY', status: 'COMPLETE', progressPct: 100, completedAt: iso(184), clientNote: 'Scope, sitemap, and content plan — signed off.', assetCount: 2 },
    { stageKey: 'DESIGN', status: 'COMPLETE', progressPct: 100, completedAt: iso(170), clientNote: 'Homepage, menu, and mobile layouts — approved.', assetCount: 3 },
    { stageKey: 'DEVELOPMENT', status: 'IN_PROGRESS', progressPct: 68, startedAt: iso(168), clientNote: 'Building your site — menu pages, reservations, and the photo gallery.', assetCount: 4 },
    { stageKey: 'REVIEW', status: 'PENDING', progressPct: 0, clientNote: 'You walk the finished site and tell us what to change.', assetCount: 0 },
    { stageKey: 'LAUNCH', status: 'PENDING', progressPct: 0, clientNote: 'Domain, hosting, and going live.', assetCount: 0 },
    { stageKey: 'MAINTENANCE', status: 'PENDING', progressPct: 0, clientNote: 'Monthly updates, security, and content changes.', assetCount: 0 },
  ],
}

const CHANGE_ORDER = {
  id: 'co-18', refNumber: 'CO-0018', amountCents: 42500,
  estimatedHours: 5, addedDays: 3, status: 'SENT', sentAt: iso(2),
  description:
    'Covers a catering order form, a Stripe checkout for deposits, and an email confirmation to you and the customer.',
}

const REQUESTS = [
  {
    id: 'r-412', refNumber: 'REQ-0412', type: 'UPDATE', status: 'NEEDS_CLIENT',
    billing: 'BILLABLE', title: 'Online ordering for the catering menu',
    projectId: 'p-hsk', createdAt: iso(3), updatedAt: iso(2), unread: true,
    changeOrder: CHANGE_ORDER,
    preview: 'Charles quoted $425 · awaiting your approval',
    messages: [
      { id: 'm1', authorName: 'Marcus Terrell', authorId: 'u-marcus', internalOnly: false, createdAt: iso(3, 21),
        body: 'We just started doing catering for offices around 125th and people keep asking if they can order online instead of calling. Is that something we can add? Not sure how big of a lift it is.' },
      { id: 'm2', authorName: 'Charles', authorId: 'u-charles', internalOnly: false, createdAt: iso(2, 11),
        body: "Good problem to have. It's a real feature, not a tweak — you need an order form, a way to take a deposit, and confirmation emails so nothing gets lost. I've priced it at 5 hours. Full breakdown is in the estimate above.",
        assets: [{ id: 'a-90', filename: 'Catering scope.pdf', contentType: 'application/pdf' }] },
      { id: 'm3', authorName: 'Marcus Terrell', authorId: 'u-marcus', internalOnly: false, createdAt: iso(2, 18),
        body: 'Looking at it tonight. Does the deposit go to the same account as the reservations?' },
    ],
  },
  {
    id: 'r-409', refNumber: 'REQ-0409', type: 'QUESTION', status: 'NEEDS_CLIENT',
    billing: 'UNSET', title: 'Can we swap the dining room photo?',
    projectId: 'p-hsk', createdAt: iso(5), updatedAt: iso(2), unread: true,
    preview: 'Charles replied · we need a brighter version from you',
    messages: [
      { id: 'm4', authorName: 'Charles', authorId: 'u-charles', internalOnly: false, createdAt: iso(2),
        body: 'The dining room shot is too dark for the hero section. Could you send a daylight version — landscape, no flash? A phone photo is fine.' },
    ],
  },
  {
    id: 'r-407', refNumber: 'REQ-0407', type: 'UPDATE', status: 'IN_PROGRESS',
    billing: 'INCLUDED', title: 'Add Sunday brunch hours to the footer',
    projectId: 'p-hsk', createdAt: iso(8), updatedAt: iso(4), unread: false,
    preview: 'Included in your plan · Charles is on it',
    messages: [
      { id: 'm5', authorName: 'Marcus Terrell', authorId: 'u-marcus', internalOnly: false, createdAt: iso(8),
        body: 'We started brunch on Sundays, 10 to 3. Can that go in the footer with the rest of the hours?' },
    ],
  },
  {
    id: 'r-405', refNumber: 'REQ-0405', type: 'QUESTION', status: 'DONE',
    billing: 'INCLUDED', title: 'How do I update prices after launch?',
    projectId: 'p-hsk', createdAt: iso(12), updatedAt: iso(10), unread: false,
    preview: 'Charles replied 6 days ago',
    messages: [
      { id: 'm6', authorName: 'Charles', authorId: 'u-charles', internalOnly: false, createdAt: iso(10),
        body: 'The menu reads from a spreadsheet you own. Change a price there, save, and the site picks it up within a minute. No login needed.' },
    ],
  },
]

const PORTAL_HOME = {
  org: { id: 'org-hsk', name: 'Harlem Soul Kitchen', dealTier: 'PREFERRED' },
  user: CLIENT_USER,
  activeProject: PROJECT,
  needsYou: [
    { kind: 'CHANGE_ORDER', requestId: 'r-412', refNumber: 'REQ-0412',
      title: 'Online ordering for the catering menu', amountCents: 42500, hours: 5 },
    { kind: 'ASSET_REQUEST', requestId: 'r-409', refNumber: 'REQ-0409',
      title: 'We need a better photo of the dining room',
      body: 'The one you sent is too dark for the hero section. Daylight, landscape, no flash — a phone photo is fine.',
      askedAt: iso(2) },
  ],
  balanceDueCents: 51000,
  nextInvoice: { id: 'inv-31', number: 'INV-0031', totalCents: 51000, dueOn: future(6),
    description: 'Change order + extra hour' },
  recentActivity: [
    { id: 'act1', actorName: 'Charles', body: 'published 4 new files to Development', at: iso(1, 16) },
    { id: 'act2', actorName: 'Charles', body: 'quoted REQ-0412 at $425', at: iso(2, 11) },
    { id: 'act3', actorName: 'You', body: 'opened REQ-0412 — Online ordering for catering', at: iso(3, 21) },
    { id: 'act4', actorName: 'Charles', body: 'Design marked complete · 02', at: iso(170) },
  ],
}

const BILLING = {
  complimentary: false,
  balanceDueCents: 51000,
  plan: { code: 'CARE', name: 'Care · 2-year contract', priceCents: 5000, interval: 'MONTH', includedHours: 2 },
  subscription: { status: 'ACTIVE', currentPeriodEnd: future(14), hoursUsed: 1.4, termMonths: 24, autopay: true },
  paymentMethods: [
    { id: 'pm-1', type: 'CARD', brand: 'visa', last4: '4242', expMonth: 8, expYear: 2028, isDefault: true },
    { id: 'pm-2', type: 'BANK', brand: 'Chase business checking', last4: '8891', isDefault: false },
  ],
  invoices: [
    { id: 'inv-31', number: 'INV-0031', description: 'Change order + extra hour', totalCents: 51000, status: 'SENT', dueOn: future(6) },
    { id: 'inv-29', number: 'INV-0029', description: 'Care plan — August', totalCents: 5000, status: 'PAID', paidAt: iso(17) },
    { id: 'inv-26', number: 'INV-0026', description: 'Care plan — July', totalCents: 5000, status: 'PAID', paidAt: iso(48) },
    { id: 'inv-19', number: 'INV-0019', description: 'Down payment — 2-yr contract', totalCents: 20000, status: 'PAID', paidAt: iso(188) },
  ],
}

const ASSETS = [
  { id: 'a-1', filename: 'dining-room-01.jpg', contentType: 'image/jpeg', sizeBytes: 2516582, source: 'CLIENT_UPLOAD', reviewStatus: 'NEEDS_REPLACEMENT', stageKey: 'DEVELOPMENT', createdAt: iso(9) },
  { id: 'a-2', filename: 'oxtail-plate.jpg', contentType: 'image/jpeg', sizeBytes: 3250586, source: 'CLIENT_UPLOAD', reviewStatus: 'IN_USE', stageKey: 'DEVELOPMENT', createdAt: iso(9) },
  { id: 'a-3', filename: 'storefront-dusk.jpg', contentType: 'image/jpeg', sizeBytes: 4194304, source: 'CLIENT_UPLOAD', reviewStatus: 'IN_USE', stageKey: 'DESIGN', createdAt: iso(9) },
  { id: 'a-4', filename: 'full-menu-spring.pdf', contentType: 'application/pdf', sizeBytes: 911360, source: 'CLIENT_UPLOAD', reviewStatus: 'NONE', stageKey: 'DISCOVERY', createdAt: iso(21) },
  { id: 'a-5', filename: 'homepage-mockup-v3.png', contentType: 'image/png', sizeBytes: 1887436, source: 'AGENCY_UPLOAD', reviewStatus: 'NONE', stageKey: 'DESIGN', createdAt: iso(172) },
  { id: 'a-6', filename: 'menu-page-mockup.png', contentType: 'image/png', sizeBytes: 2306867, source: 'AGENCY_UPLOAD', reviewStatus: 'NONE', stageKey: 'DESIGN', createdAt: iso(172) },
  { id: 'a-7', filename: 'hsk-logo-vector.pdf', contentType: 'application/pdf', sizeBytes: 215040, source: 'CLIENT_UPLOAD', reviewStatus: 'NONE', stageKey: 'DISCOVERY', createdAt: iso(186) },
  { id: 'a-8', filename: 'chef-marcus-portrait.jpg', contentType: 'image/jpeg', sizeBytes: 3040870, source: 'CLIENT_UPLOAD', reviewStatus: 'IN_USE', stageKey: 'DESIGN', createdAt: iso(186) },
]

const ADMIN_DASHBOARD = {
  newRequests: 3, awaitingReply: 4, pastDueInvoices: 1, callsDue: 9,
  money: { recurringCents: 65000, collectedCents: 234000, outstandingCents: 128500 },
  blockedOnYou: [
    { id: 'r-416', refNumber: 'REQ-0416', title: "Listing photos aren't loading on mobile", orgName: 'Crown Heights Realty', note: 'unassigned · no reply yet', flag: '14h no reply' },
    { id: 'inv-27', refNumber: 'INV-0027', title: '$600 went past due overnight', orgName: 'BK Fitness Co.', note: 'due Aug 17 · no payment method on file', flag: 'Past due' },
  ],
  newSince: [
    { id: 'r-415', refNumber: 'REQ-0415', title: 'Add a class schedule page', orgName: 'BK Fitness Co.', at: iso(0, 5) },
    { id: 'r-414', refNumber: 'REQ-0414', title: 'Change the office phone number in the footer', orgName: 'Crown Heights Realty', at: iso(0, 2) },
    { id: 'r-413', refNumber: 'REQ-0413', title: 'Question about editing prices after launch', orgName: 'Harlem Soul Kitchen', at: iso(1, 14) },
  ],
  callsDueList: [
    { id: 'l-1', name: 'Denise Whitaker', org: 'Crown Heights Realty', note: 'proposal sent Aug 11', flag: 'Overdue' },
    { id: 'l-2', name: 'James Ruiz', org: 'BK Fitness', note: 'follow up on quote', time: '9:30' },
    { id: 'l-3', name: 'Marcus Terrell', org: 'Harlem Soul', note: 'walk through REQ-0412', time: '11:00' },
    { id: 'l-4', name: 'Angela Perez', org: 'Cold · Bronx dental', note: '2nd attempt', time: '2:00' },
  ],
}

const routes = [
  [/^\/v1\/public\/health$/, () => ({ status: 'UP', mock: true })],
  [/^\/v1\/public\/contact$/, () => null],

  [/^\/v1\/auth\/login$/, (_m, opts) => {
    const email = (opts.body?.email || '').toLowerCase()
    const user = email.includes('easycode.dev') ? ADMIN_USER : CLIENT_USER
    return { accessToken: 'mock.' + user.id, expiresIn: 900, user }
  }],
  [/^\/v1\/auth\/refresh$/, () => ({ accessToken: 'mock.refreshed', expiresIn: 900, user: CLIENT_USER })],
  [/^\/v1\/auth\/logout$/, () => null],
  [/^\/v1\/auth\/me$/, () => ({ user: CLIENT_USER, org: PORTAL_HOME.org })],
  [/^\/v1\/auth\/invites\/([^/]+)$/, () => ({
    email: 'denise@chrealty.com', orgName: 'Crown Heights Realty',
    invitedBy: 'Charles', role: 'CLIENT', expiresAt: future(7),
  })],
  [/^\/v1\/auth\/invites\/accept$/, () => ({ accessToken: 'mock.invited', user: CLIENT_USER })],
  [/^\/v1\/auth\/password\/forgot$/, () => null],
  [/^\/v1\/auth\/password\/reset$/, () => null],

  [/^\/v1\/portal\/home$/, () => PORTAL_HOME],
  [/^\/v1\/projects$/, () => ({ items: [PROJECT], total: 1 })],
  [/^\/v1\/projects\/([^/]+)$/, () => PROJECT],

  [/^\/v1\/requests$/, (_m, opts) => {
    if (opts.method === 'POST') {
      return { id: 'r-new', refNumber: 'REQ-0417', status: 'NEW', ...opts.body, messages: [] }
    }
    return { items: REQUESTS.map(({ messages, ...r }) => r), total: REQUESTS.length }
  }],
  [/^\/v1\/requests\/([^/]+)\/messages$/, (m, opts) => ({
    id: 'm-' + Date.now(), authorName: 'Marcus Terrell', authorId: 'u-marcus',
    internalOnly: false, createdAt: new Date().toISOString(), body: opts.body?.body || '',
  })],
  [/^\/v1\/requests\/([^/]+)\/read$/, () => null],
  [/^\/v1\/requests\/([^/]+)$/, (m) => REQUESTS.find((r) => r.id === m[1]) || REQUESTS[0]],

  [/^\/v1\/change-orders\/([^/]+)\/approve$/, () => ({
    changeOrder: { ...CHANGE_ORDER, status: 'APPROVED', decidedAt: new Date().toISOString() },
    invoice: { id: 'inv-32', number: 'INV-0032', totalCents: 42500, status: 'SENT', dueOn: future(14) },
  })],
  [/^\/v1\/change-orders\/([^/]+)\/decline$/, () => ({ changeOrder: { ...CHANGE_ORDER, status: 'DECLINED' } })],

  [/^\/v1\/assets\/presign$/, (_m, opts) => ({
    assetId: 'a-' + Date.now(),
    uploadUrl: 'https://example-r2.invalid/mock-upload',
    expiresAt: future(0),
    filename: opts.body?.filename,
  })],
  [/^\/v1\/assets\/([^/]+)\/complete$/, (m) => ({ id: m[1], uploadStatus: 'CONFIRMED' })],
  [/^\/v1\/assets\/([^/]+)\/url$/, () => ({ url: 'https://example-r2.invalid/mock-download' })],
  [/^\/v1\/assets$/, () => ({ items: ASSETS, total: ASSETS.length })],

  [/^\/v1\/billing\/summary$/, () => BILLING],
  [/^\/v1\/invoices\/([^/]+)\/payment-intent$/, () => ({
    clientSecret: 'pi_mock_secret', publishableKey: 'pk_test_mock', amountCents: 51000,
  })],
  [/^\/v1\/invoices\/([^/]+)$/, (m) => ({
    ...BILLING.invoices.find((i) => i.id === m[1]) || BILLING.invoices[0],
    lines: [
      { id: 'li1', description: 'Catering order form — change order', quantity: 1, unitAmountCents: 42500, amountCents: 42500 },
      { id: 'li2', description: 'Extra hours (1 × $85)', quantity: 1, unitAmountCents: 8500, amountCents: 8500 },
    ],
    billToName: 'Renee Terrell', billToEmail: 'renee@hsk.com', issuedOn: iso(7),
  })],

  [/^\/v1\/admin\/dashboard$/, () => ADMIN_DASHBOARD],
]

export async function mockFetch(path, opts = {}) {
  await wait()
  const clean = path.split('?')[0]
  for (const [re, fn] of routes) {
    const m = clean.match(re)
    if (m) return fn(m, opts)
  }
  // Unmocked route: fail loudly rather than returning undefined and
  // rendering a blank screen you'd spend an hour debugging.
  throw Object.assign(
    new Error(`No mock for ${opts.method || 'GET'} ${clean} — add it to src/lib/mock.js`),
    { status: 501, code: 'NOT_MOCKED' },
  )
}
