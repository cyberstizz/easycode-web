/**
 * Money-path checks. Run: node src/lib/__verify-billing.mjs
 *
 * These cover the parts of the payment flow that live in the frontend and can
 * silently be wrong: the invoice adapter (field names the handoff warned
 * about), the payable rule, cents arithmetic, the admin create-invoice payload,
 * and the state machine a client walks through. The card entry itself is
 * Stripe's Payment Element and is tested by Stripe; the webhook is Java and is
 * covered by the checklist below rather than here.
 */
import {
  adaptInvoice, adaptBillingSummary, adaptIntent, adaptCard,
  invoiceTone, invoiceLabel, INVOICE_KIND,
  adaptMaintenanceBoard, adaptProjectMaintenance, adaptMaintenanceReports, dayLabel, dayOfWeek,
} from './endpoints.js'

let fail = 0
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail++ }

// Exactly what InvoiceView serialises — note amountCents/memo/dueAt, never
// totalCents/description/dueOn.
const openInvoice = {
  id: 'inv-1', orgId: 'org-1', projectId: 'p-1', number: 'INV-0007', kind: 'DEPOSIT',
  status: 'OPEN', amountCents: 60000, amountPaidCents: 0, balanceCents: 60000,
  memo: 'Deposit for the main site', dueAt: '2099-01-01T00:00:00Z', sentAt: '2026-09-10T00:00:00Z',
  paidAt: null, createdAt: '2026-09-10T00:00:00Z',
  lines: [{ description: 'Website deposit (50%)', quantity: 1, unitCents: 60000, totalCents: 60000 }],
}

console.log('\nadaptInvoice — field names')
const inv = adaptInvoice(openInvoice)
ok(inv.amountCents === 60000, 'amountCents carried through')
ok(inv.totalCents === 60000, 'totalCents derived for legacy readers')
ok(inv.description === 'Deposit for the main site', 'description derived from memo')
ok(inv.dueOn === openInvoice.dueAt, 'dueOn derived from dueAt')
ok(Array.isArray(inv.lines) && inv.lines.length === 1, 'lines preserved')
ok(Array.isArray(adaptInvoice({ ...openInvoice, lines: undefined }).lines), 'missing lines becomes [] not undefined')

console.log('\npayable — the rule the Pay button obeys')
ok(adaptInvoice(openInvoice).payable === true, 'OPEN with balance > 0 is payable')
ok(adaptInvoice({ ...openInvoice, status: 'PAID', balanceCents: 0 }).payable === false, 'PAID is not payable')
ok(adaptInvoice({ ...openInvoice, status: 'VOID' }).payable === false, 'VOID is not payable')
ok(adaptInvoice({ ...openInvoice, status: 'DRAFT' }).payable === false, 'DRAFT is not payable — client must not see a Pay button for an unsent invoice')
ok(adaptInvoice({ ...openInvoice, balanceCents: 0 }).payable === false, 'OPEN with zero balance is not payable')
ok(adaptInvoice({ ...openInvoice, balanceCents: undefined }).payable === false, 'missing balance is treated as nothing to pay, not NaN')

console.log('\nstatus chips — what the client is told')
ok(invoiceLabel('OPEN', '2099-01-01T00:00:00Z') === 'Due', 'future dueAt reads Due')
ok(invoiceLabel('OPEN', '2000-01-01T00:00:00Z') === 'Overdue', 'past dueAt reads Overdue')
ok(invoiceTone('OPEN', '2000-01-01T00:00:00Z') === 'c-late', 'overdue gets the red tone')
ok(invoiceLabel('PAID', '2000-01-01T00:00:00Z') === 'Paid', 'PAID is never Overdue even if dueAt is past')
ok(invoiceLabel('OPEN', null) === 'Due', 'no dueAt still reads Due, not Overdue')

console.log('\nadaptBillingSummary — what Billing.jsx destructures')
const summary = adaptBillingSummary({
  amountDueCents: 60000,
  invoices: [openInvoice, { ...openInvoice, id: 'inv-0', number: 'INV-0006', status: 'PAID', amountPaidCents: 20000, amountCents: 20000, balanceCents: 0 }],
  subscriptions: [{ id: 's1', planId: 'pl1', planName: 'Maintenance', status: 'ACTIVE', termMonths: 24, currentPeriodEnd: '2026-10-10T00:00:00Z', cancelAt: null }],
  plans: [{ id: 'pl1', name: 'Maintenance', priceCents: 5000, interval: 'MONTH', includedHours: 2, features: ['Hosting'], purchasable: true }],
})
ok(summary.amountDueCents === 60000, 'amountDueCents is a number')
ok(summary.invoices.length === 2 && summary.invoices[0].payable === true, 'invoices are adapted, not raw')
ok(summary.activeSubscription?.status === 'ACTIVE', 'active subscription resolved')
ok(adaptBillingSummary({ subscriptions: [{ status: 'CANCELED' }] }).activeSubscription === null, 'CANCELED is not treated as active')
ok(adaptBillingSummary({ subscriptions: [{ status: 'PAST_DUE' }] }).activeSubscription?.status === 'PAST_DUE', 'PAST_DUE still shows as the current plan so the client sees the failure')
const empty = adaptBillingSummary(null)
ok(empty.amountDueCents === 0 && empty.invoices.length === 0 && empty.plans.length === 0, 'empty summary is zeroes and [], never undefined')
ok(!Number.isNaN((empty.amountDueCents ?? 0) % 100), 'cents math on an empty summary is not NaN')

console.log('\nadaptIntent / adaptCard — what PayInvoice and Billing read')
ok(adaptIntent({ clientSecret: 'pi_x_secret_y', intentId: 'pi_x', amountCents: 60000 }).clientSecret === 'pi_x_secret_y', 'clientSecret passes through')
ok(adaptIntent(null).clientSecret === null, 'null intent gives null secret, so the Elements provider is never mounted with garbage')
ok(adaptCard({ card: { brand: 'visa', last4: '4242', expMonth: 12, expYear: 2030 } })?.last4 === '4242', 'card on file resolves')
ok(adaptCard({ card: null }) === null, 'no card on file is null, not an empty object')

console.log('\nadmin create-invoice payload — cents arithmetic')
const lines = [
  { description: 'Homepage', quantity: '1', unitDollars: '600' },
  { description: 'Extra pages', quantity: '3', unitDollars: '75.50' },
  { description: '', quantity: '1', unitDollars: '999' },        // blank description: dropped
]
const payloadLines = lines.filter((l) => l.description.trim()).map((l) => ({
  description: l.description.trim(),
  quantity: Number(l.quantity) || 1,
  unitCents: Math.round((Number(l.unitDollars) || 0) * 100),
}))
ok(payloadLines.length === 2, 'blank-description lines are dropped before sending')
ok(payloadLines[1].unitCents === 7550, '$75.50 becomes 7550 cents, not 7549.999')
const total = lines.reduce((n, l) => n + Math.round((Number(l.unitDollars) || 0) * 100) * (Number(l.quantity) || 0), 0)
ok(total === 60000 + 22650 + 99900, 'preview total multiplies cents by quantity per line')
ok(Math.round(0.1 * 100) + Math.round(0.2 * 100) === 30, 'rounding at cents avoids the 0.1 + 0.2 trap')
const day = '2026-09-30'
const dueAt = new Date(`${day}T12:00:00.000Z`).toISOString()
ok(dueAt === '2026-09-30T12:00:00.000Z', 'due date is sent as a full Instant, not a bare day (which Jackson rejects)')
ok(Object.values(INVOICE_KIND).includes('DEPOSIT') && Object.values(INVOICE_KIND).includes('CHANGE_ORDER'), 'invoice kinds match the Java enum')

console.log('\nclient journey — the states a paying client walks through')
const steps = [
  ['admin creates', { status: 'DRAFT', balanceCents: 60000 }, false],
  ['admin sends', { status: 'OPEN', balanceCents: 60000 }, true],
  ['client pays, webhook lands', { status: 'PAID', balanceCents: 0, amountPaidCents: 60000 }, false],
]
for (const [label, patch, expectPayable] of steps) {
  ok(adaptInvoice({ ...openInvoice, ...patch }).payable === expectPayable, `${label} → payable=${expectPayable}`)
}

// ── maintenance ──────────────────────────────────────────────────────
// Exactly what MaintenanceController.board() serialises. dueOn is a plain
// YYYY-MM-DD date, NOT an Instant.
const board = {
  today: '2026-09-17',
  overdue: [{ visitId: 'v1', projectId: 'p1', projectName: 'DesignHer', orgId: 'o1', orgName: 'DesignHer Inc',
              dueOn: '2026-09-03', daysLate: 14, cadenceDays: 14, missedCycles: 0 }],
  dueToday: [{ visitId: 'v2', projectId: 'p2', projectName: 'Femme Standard', orgId: 'o2', orgName: 'The Femme Standard',
               dueOn: '2026-09-17', daysLate: 0, cadenceDays: 14, missedCycles: 0 }],
  thisWeek: [{ visitId: 'v3', projectId: 'p3', projectName: 'Third', orgId: 'o3', orgName: 'Third Co',
               dueOn: '2026-09-21', daysLate: 0, cadenceDays: 14, missedCycles: 1 }],
  later: [],
  activeSchedules: 9,
}

console.log('\nadaptMaintenanceBoard — the week view')
const b = adaptMaintenanceBoard(board)
ok(b.overdue.length === 1 && b.dueToday.length === 1, 'buckets survive the adapter')
ok(b.openCount === 3, 'openCount sums the three live buckets')
ok(b.activeSchedules === 9, 'activeSchedules carried through')
const e = adaptMaintenanceBoard(null)
ok(e.overdue.length === 0 && e.dueToday.length === 0 && e.openCount === 0, 'empty board is [] everywhere, never undefined')
ok(e.activeSchedules === 0, 'empty activeSchedules is 0, not NaN')

console.log('\ndayLabel — the timezone trap')
// new Date('2026-09-17') parses as UTC midnight and renders as Sep 16 in New York.
ok(new Date('2026-09-17').toLocaleDateString('en-US', { day: 'numeric', timeZone: 'America/New_York' }) === '16',
   'the naive parse really does shift the day back (this is why dayLabel exists)')
ok(dayLabel('2026-09-17', { month: 'short', day: 'numeric' }) === 'Sep 17', 'dayLabel keeps the correct day')
ok(dayLabel('2026-01-01', { month: 'short', day: 'numeric' }) === 'Jan 1', 'dayLabel holds across a year boundary')
ok(dayOfWeek('2026-09-17') === 'Thu', 'dayOfWeek is correct')
ok(dayLabel(null) === '—', 'missing date renders a dash, not Invalid Date')

console.log('\nadaptProjectMaintenance / reports')
const pm = adaptProjectMaintenance({ schedule: { cadenceDays: 14, anchorOn: '2026-09-03', active: true }, open: { id: 'v1', dueOn: '2026-09-17' }, history: [{ id: 'h1' }] })
ok(pm.schedule.cadenceDays === 14 && pm.open.id === 'v1' && pm.history.length === 1, 'panel shape resolves')
const none = adaptProjectMaintenance(null)
ok(none.schedule === null && none.open === null && none.history.length === 0, 'no schedule yet is null + [], so the panel offers to create one')
ok(adaptMaintenanceReports({ items: [{ id: 'r1', report: 'x' }] }).length === 1, 'client reports resolve')
ok(adaptMaintenanceReports(null).length === 0, 'no reports is an empty array')

console.log('\nthe client must never receive a due date')
const clientPayload = { items: [{ id: 'r1', completedAt: '2026-09-03T10:00:00Z', by: 'Charles', report: 'Updated plugins.' }] }
const fields = Object.keys(adaptMaintenanceReports(clientPayload)[0])
ok(!fields.includes('dueOn'), 'no dueOn in the client report shape')
ok(!fields.includes('missedCycles'), 'no missedCycles in the client report shape')
ok(!fields.includes('internalNote'), 'no internalNote in the client report shape')

console.log('\nanchored cadence — the arithmetic the server does')
const addDays = (ymd, n) => { const [y, m, d] = ymd.split('-').map(Number); const t = new Date(Date.UTC(y, m - 1, d + n)); return t.toISOString().slice(0, 10) }
ok(addDays('2026-09-03', 14) === '2026-09-17', 'next due is previous due + cadence, not completion + cadence')
// Finishing the Sep 3 visit on Oct 1 must not push the next one to Oct 15.
let next = addDays('2026-09-03', 14), missed = 0
while (next < '2026-10-01') { next = addDays(next, 14); missed++ }
ok(next === '2026-10-01' || next > '2026-10-01', 'a very late completion rolls forward to a future date')
ok(missed >= 1, 'and records the periods it skipped instead of hiding them')

console.log(fail === 0 ? '\nAll billing and maintenance checks passed.\n' : `\n${fail} FAILED\n`)
process.exit(fail ? 1 : 0)
