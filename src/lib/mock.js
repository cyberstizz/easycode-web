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

/**
 * Mock session. Held in sessionStorage so a page reload behaves like the real
 * httpOnly refresh cookie does — you stay signed in across reloads, but a
 * fresh tab starts signed out. Without this, /refresh always succeeded and the
 * app auto-authenticated on every load, which made /login unreachable.
 */
const SESSION_KEY = 'easycode.mock.session'
const readSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null') } catch { return null }
}
const writeSession = (user) => {
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)) } catch { /* private mode */ }
  return user
}
const clearSession = () => {
  try { sessionStorage.removeItem(SESSION_KEY) } catch { /* private mode */ }
}

class MockUnauthorized extends Error {
  constructor() { super('No mock session. Sign in at /login.'); this.status = 401; this.code = 'UNAUTHORIZED' }
}

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


// ── leads ──────────────────────────────────────────────────
const LEADS = [
  { id:'l-denise', contactName:'Denise Whitaker', businessName:'Crown Heights Realty',
    email:'denise@chrealty.com', phone:'(718) 555-0192', city:'Brooklyn NY', roleTitle:'Broker',
    source:'REFERRAL', sourceNote:'Referral — Marcus T.', status:'NEGOTIATING', rungOffered:'FLOOR',
    ownerName:'Charles', nextActionAt:iso(2), nextActionNote:'Brother said yes or no — close it or park it',
    callCount:5, connectedCount:3, createdAt:iso(24),
    leadWith:'Her objection is trust, not price. Show her the portal — watching the build stage by stage answers the exact fear she has, and it costs you nothing to give.',
    notes:'Partner is her brother, handles the money. Best before 11 AM — showings all afternoon. Referred by Marcus, so a good outcome travels.',
    rungHistory:{ STANDARD:'DECLINED', PREFERRED:'DECLINED', FLOOR:'OFFERED' },
    activities:[
      { id:'a1', type:'CALL', outcome:'CONNECTED', durationSeconds:840, occurredAt:iso(10,10), userName:'Charles',
        objectionTags:['Trust'], rungOffered:'FLOOR',
        body:"Dropped to the $100 floor and told her that's the end of the line. She said she needs to talk to her partner. Asked for it in writing — sent same day. Her real hesitation is she got burned by a designer last year who took a deposit and vanished." },
      { id:'a2', type:'CALL', outcome:'CONNECTED', durationSeconds:540, occurredAt:iso(15,14), userName:'Charles',
        objectionTags:['Cash flow'], rungOffered:'PREFERRED',
        body:'Pitched the 2-year contract at $200 down. She liked the monthly number but balked at the deposit — cash is tight until listings pick up in September.' },
      { id:'a3', type:'CALL', outcome:'VOICEMAIL', occurredAt:iso(20,11), userName:'Charles',
        objectionTags:[], rungOffered:'NONE', body:'Left message referencing Marcus. No callback.' },
      { id:'a4', type:'CALL', outcome:'CONNECTED', durationSeconds:1260, occurredAt:iso(24,9), userName:'Charles',
        objectionTags:[], rungOffered:'STANDARD',
        body:'First real conversation. Runs 3 agents, no site at all — everything goes through Zillow. Wants listing pages she controls. Quoted standard $1,200 at 50% down; she went quiet on the number.' },
    ] },
  { id:'l-priya', contactName:'Priya Raman', businessName:'Raman Physical Therapy', phone:'(917) 555-0143',
    source:'COLD_CALL', status:'CONTACTED', rungOffered:'NONE', ownerName:'Charles',
    nextActionAt:iso(6), nextActionNote:'Said call back after the 15th', callCount:3, connectedCount:1, activities:[] },
  { id:'l-james', contactName:'James Ruiz', businessName:'BK Fitness Co.', phone:'(347) 555-0188',
    source:'REFERRAL', status:'PITCHED', rungOffered:'PREFERRED', ownerName:'Charles',
    nextActionAt:iso(0,9), nextActionNote:'Follow up — he was checking with his partner', callCount:2, connectedCount:2, activities:[] },
  { id:'l-lourdes', contactName:'Lourdes Rivera', businessName:'Rivera Bakery', phone:'(718) 555-0210',
    source:'COLD_CALL', status:'PITCHED', rungOffered:'PREFERRED', ownerName:'Charles',
    nextActionAt:iso(0,14), nextActionNote:'Sent the contract offer Tuesday, no reply', callCount:2, connectedCount:1, activities:[] },
  { id:'l-errol', contactName:'Errol Grant', businessName:'Grant & Sons Plumbing', phone:'(718) 555-0166',
    source:'COLD_CALL', status:'PITCHED', rungOffered:'STANDARD', ownerName:'Charles',
    nextActionAt:future(2), callCount:1, connectedCount:1, activities:[] },
  { id:'l-hector', contactName:'Hector Diaz', businessName:'Diaz Landscaping', phone:'(914) 555-0177',
    source:'REFERRAL', status:'NEGOTIATING', rungOffered:'PREFERRED', ownerName:'Charles',
    nextActionAt:future(1), nextActionNote:'Wants a 1-year term instead of 2', callCount:4, connectedCount:3, activities:[] },
  { id:'l-angela', contactName:'Angela Perez', businessName:'Bronx Family Dental', phone:'(718) 555-0122',
    source:'COLD_CALL', status:'NEW', rungOffered:'NONE', ownerName:'Charles', callCount:0, connectedCount:0, activities:[] },
  { id:'l-tony', contactName:'Tony Gallo', businessName:'Gallo Auto Body', phone:'(914) 555-0199',
    source:'COLD_CALL', status:'NEW', rungOffered:'NONE', ownerName:'Charles', callCount:0, connectedCount:0, activities:[] },
  { id:'l-simone', contactName:'Simone Baptiste', businessName:'Baptiste Hair Studio', phone:'(347) 555-0155',
    source:'WEBSITE_FORM', status:'NEW', rungOffered:'NONE', ownerName:'Charles',
    nextActionAt:iso(0,8), nextActionNote:'Filled out the website form', callCount:0, connectedCount:0, createdAt:iso(1), activities:[] },
  { id:'l-victor', contactName:'Victor Nunez', businessName:'Nunez Moving & Storage', phone:'(718) 555-0133',
    source:'REFERRAL', status:'NEW', rungOffered:'NONE', ownerName:'Charles', callCount:0, connectedCount:0, activities:[] },
  { id:'l-dana', contactName:'Dana Okafor', businessName:'Okafor Tax Services', phone:'(917) 555-0101',
    source:'COLD_CALL', status:'CONTACTED', rungOffered:'NONE', ownerName:'Charles',
    nextActionAt:future(3), nextActionNote:'Callback Thursday', callCount:2, connectedCount:1, activities:[] },
  { id:'l-michael', contactName:'Michael Sun', businessName:'Sun Garden Restaurant', phone:'(212) 555-0198',
    source:'COLD_CALL', status:'CONTACTED', rungOffered:'NONE', ownerName:'Charles',
    nextActionAt:future(5), callCount:1, connectedCount:1, activities:[] },
  { id:'l-kwame', contactName:'Kwame Boateng', businessName:'Boateng Barbers', phone:'(347) 555-0144',
    source:'COLD_CALL', status:'CONTACTED', rungOffered:'NONE', ownerName:'Charles',
    nextActionAt:future(9), nextActionNote:'No answer x4 — try once more then park', callCount:4, connectedCount:0, activities:[] },
  { id:'l-marcus', contactName:'Marcus Terrell', businessName:'Harlem Soul Kitchen', phone:'(212) 555-0147',
    source:'COLD_CALL', status:'WON', rungOffered:'PREFERRED', ownerName:'Charles',
    callCount:6, connectedCount:5, wonAt:iso(188), activities:[] },
  { id:'l-rosa', contactName:'Rosa Almonte', businessName:'Almonte Flowers', phone:'(718) 555-0170',
    source:'REFERRAL', status:'WON', rungOffered:'PREFERRED', ownerName:'Charles',
    callCount:3, connectedCount:2, wonAt:iso(20), activities:[] },
  { id:'l-ben', contactName:'Ben Osei', businessName:'Osei Insurance', phone:'(917) 555-0180',
    source:'REFERRAL', status:'WON', rungOffered:'SPECIAL', ownerName:'Charles',
    callCount:2, connectedCount:2, wonAt:iso(9), activities:[] },
]

const LEAD_STATS = {
  dialsToday: 0, dialsGoal: 60, dialsThisWeek: 186, closedThisMonth: 3,
  pipelineValueCents: 1960000,
  objectionCounts: [
    { tag: 'Cash flow', losses: 6 },
    { tag: 'Trust', losses: 4 },
    { tag: 'Happy as is', losses: 3 },
  ],
  rungConversion: [
    { rung: 'PREFERRED', wins: 8, of: 10 },
    { rung: 'FLOOR', wins: 1, of: 10 },
    { rung: 'STANDARD', wins: 1, of: 10 },
  ],
  dialsPerClose: 62,
}

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
    if (!email) throw Object.assign(new Error('Enter your email.'), { status: 400, code: 'VALIDATION_FAILED' })
    const user = email.includes('easycode.dev') ? ADMIN_USER : CLIENT_USER
    writeSession(user)
    return { accessToken: 'mock.' + user.id, expiresIn: 900, user }
  }],
  [/^\/v1\/auth\/refresh$/, () => {
    const user = readSession()
    if (!user) throw new MockUnauthorized()
    return { accessToken: 'mock.refreshed', expiresIn: 900, user }
  }],
  [/^\/v1\/auth\/logout$/, () => { clearSession(); return null }],
  [/^\/v1\/auth\/me$/, () => {
    const user = readSession()
    if (!user) throw new MockUnauthorized()
    return { user, org: user.orgId ? PORTAL_HOME.org : null }
  }],
  [/^\/v1\/auth\/invites\/([^/]+)$/, () => ({
    email: 'denise@chrealty.com', orgName: 'Crown Heights Realty',
    invitedBy: 'Charles', role: 'CLIENT', expiresAt: future(7),
  })],
  [/^\/v1\/auth\/invites\/accept$/, () => ({ accessToken: 'mock.invited', user: writeSession(CLIENT_USER) })],
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

  [/^\/v1\/admin\/leads\/board$/, () => ({ items: LEADS, stats: LEAD_STATS })],
  [/^\/v1\/admin\/leads\/due$/, () => ({
    items: LEADS.filter((l) => l.nextActionAt && l.status !== 'WON'), stats: LEAD_STATS,
  })],
  [/^\/v1\/admin\/leads\/([^/]+)\/activities$/, (m, opts) => ({
    id: 'a-' + Date.now(), type: 'CALL', userName: 'Charles',
    occurredAt: new Date().toISOString(), ...opts.body,
  })],
  [/^\/v1\/admin\/leads\/([^/]+)\/convert$/, () => ({
    org: { id: 'org-new', name: 'Crown Heights Realty' },
    project: { id: 'p-new', name: 'Crown Heights Realty — main site' },
    invoice: { id: 'inv-new', number: 'INV-0033', totalCents: 10000 },
    inviteSent: true,
  })],
  [/^\/v1\/admin\/leads\/([^/]+)$/, (m, opts) => {
    const found = LEADS.find((l) => l.id === m[1]) || LEADS[0]
    if (opts.method === 'PATCH') return { ...found, ...opts.body }
    return found
  }],
  [/^\/v1\/admin\/leads$/, (_m, opts) => {
    if (opts.method === 'POST') {
      const created = { id: 'l-' + Date.now(), status: 'NEW', rungOffered: 'NONE',
        callCount: 0, connectedCount: 0, activities: [], createdAt: new Date().toISOString(), ...opts.body }
      LEADS.unshift(created)
      return created
    }
    return { items: LEADS, total: LEADS.length }
  }],
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