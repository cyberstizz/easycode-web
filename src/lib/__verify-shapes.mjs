import { adaptProject, adaptProjects, adaptPortalHome, adaptRequests, adaptChecklist, EP } from './endpoints.js'

const PID = '4db5c3ba-9450-4cd8-960c-f3d9dc40f87c'
let fail = 0
const ok = (c, m) => { console.log((c ? '  PASS  ' : '  FAIL  ') + m); if (!c) fail++ }

// ── Exactly what ProjectView.of() + StageView.of() serialise ──────────
const detailResponse = {
  id: PID, orgId: 'org-1', orgName: 'Acme', name: 'Acme site', type: 'MARKETING',
  status: 'ACTIVE', currentStage: 'DEVELOPMENT', currentPosition: 3,
  contractCents: 120000, depositCents: 60000,
  startedAt: '2026-07-01T00:00:00Z', estLaunchAt: '2026-10-01T12:00:00Z',
  liveUrl: null, previewUrl: null, repoUrl: null,
  stages: [
    { id: 's1', key: 'DISCOVERY',   label: 'Discovery',   position: 1, status: 'COMPLETE', progressPct: 100, clientNote: null, internalNote: null },
    { id: 's3', key: 'DEVELOPMENT', label: 'Development', position: 3, status: 'ACTIVE',   progressPct: 12,  clientNote: 'Building the booking form', internalNote: 'x' },
  ],
}

console.log('\nGET /v1/projects/{id} -> adaptProject')
const proj = adaptProject(detailResponse)
const active = proj.currentStage
const stage = (proj.stages || []).find((s) => s.stageKey === active)
ok(!!stage, 'ProjectEditor can find the active stage by s.stageKey')
ok(stage?.progressPct === 12, 'saved progressPct 12 reaches the form')
ok(stage?.clientNote === 'Building the booking form', 'saved clientNote reaches the form')

const byKey = Object.fromEntries(proj.stages.map((s) => [s.stageKey ?? s.key, s]))
ok(Object.keys(byKey).length === 2 && !('undefined' in byKey), 'StageRail byKey has real keys, not one undefined bucket')
ok(byKey.DEVELOPMENT?.status === 'ACTIVE', 'the live stage resolves as ACTIVE, so the rail lights up')

console.log('\nPATCH url')
ok(EP.adminProjectStage(PID, active) === `/v1/admin/projects/${PID}/stages/DEVELOPMENT`,
   'stage PATCH targets the right path')

// ── Exactly what DashboardController.portalHome() serialises ──────────
const portalResponse = {
  openRequests: 2, unreadReplies: 1, amountDueCents: 60000,
  projects: [{ ...detailResponse, stages: [] }],          // summary() sends List.of()
  recentRequests: [{ id: 'r1', orgName: 'Acme', title: 'Swap the hero photo',
                     status: 'NEEDS_CLIENT', createdAt: '2026-08-30T10:00:00Z',
                     updatedAt: '2026-08-31T10:00:00Z' }],
  recentFiles: [{ id: 'f1', filename: 'logo.png', createdAt: '2026-08-29T09:00:00Z' }],
  openInvoices: [{ id: 'i1', number: 'INV-0002', amountCents: 60000, memo: 'Deposit',
                   dueAt: '2026-09-15T00:00:00Z', status: 'OPEN' }],
}

console.log('\nGET /v1/portal/home -> adaptPortalHome')
const home = adaptPortalHome(portalResponse)
ok(home.activeProject !== null, 'activeProject resolves (was undefined -> "hasn\'t started yet")')
ok(typeof home.balanceDueCents === 'number' && !Number.isNaN(home.balanceDueCents),
   'balanceDueCents is a number')
ok(!Number.isNaN((home.balanceDueCents ?? 0) % 100), 'the cents suffix is not NaN')
ok(home.nextInvoice?.description === 'Deposit', 'nextInvoice maps memo -> description')
ok(home.nextInvoice?.dueOn === '2026-09-15T00:00:00Z', 'nextInvoice maps dueAt -> dueOn')
ok(home.needsYou.length === 1, 'NEEDS_CLIENT request becomes a "needs you" card')
ok(home.needsYou[0].refNumber?.startsWith('REQ-'), 'needsYou card has a ref number')
ok(home.recentActivity.length === 2, 'activity feed built from requests + files')
ok(home.activeProject.stages.length === 0, 'portal home genuinely carries no stages (detail fetch required)')

console.log('\nGET /v1/projects (bare array) -> adaptProjects')
const listed = adaptProjects([{ ...detailResponse, stages: [] }])
ok(Array.isArray(listed.items) && listed.items.length === 1, 'bare array normalises to .items')

// ── Exactly what ChecklistController.body() serialises ────────────────
const checklistResponse = {
  items: [
    { id: 'c1', stageKey: 'DISCOVERY', position: 1, title: 'Proposal signed and deposit cleared before any work starts',
      guidance: 'Not after the mockup. The deposit is what makes the project real.',
      emphasis: true, done: true, doneByName: 'Charles', doneAt: '2026-09-01T10:00:00Z', note: 'Paid 9/1' },
    { id: 'c2', stageKey: 'DISCOVERY', position: 2, title: 'Kickoff call held and recorded',
      guidance: '', emphasis: false, done: false, doneByName: null, doneAt: null, note: null },
    { id: 'c3', stageKey: 'REVIEW', position: 1, title: 'Walked through on a real phone',
      guidance: 'not a browser device emulator', emphasis: true, done: false,
      doneByName: null, doneAt: null, note: null },
  ],
  stages: [
    { stageKey: 'DISCOVERY', done: 1, total: 2 },
    { stageKey: 'REVIEW', done: 0, total: 1 },
  ],
  done: 1,
  total: 3,
}

console.log('\nGET /v1/admin/projects/{id}/checklist -> adaptChecklist')
const cl = adaptChecklist(checklistResponse)
ok(cl.items.length === 3, 'items survive the adapter')
ok(cl.total === 3 && cl.done === 1, 'done/total carried through')
ok(Math.round((cl.done / cl.total) * 100) === 33, 'progress percentage computes without NaN')
const disc = cl.stages.find((s) => s.stageKey === 'DISCOVERY')
ok(disc && disc.done === 1 && disc.total === 2, 'per-stage counts resolve by stageKey')
ok(cl.items.filter((i) => i.stageKey === 'DISCOVERY').length === 2, 'items group by stage')
ok(adaptChecklist(null).total === 0 && adaptChecklist(null).items.length === 0,
   'empty response degrades to zeroes, not NaN')
ok(adaptChecklist({}).stages.length === 0, 'missing arrays default to []')

const toggled = {
  ...cl,
  items: cl.items.map((i) => (i.id === 'c2' ? { ...i, done: true } : i)),
  done: cl.done + 1,
  stages: cl.stages.map((s) => (s.stageKey === 'DISCOVERY' ? { ...s, done: s.done + 1 } : s)),
}
ok(toggled.done === 2, 'optimistic tick increments the overall count')
ok(toggled.stages.find((s) => s.stageKey === 'DISCOVERY').done === 2,
   'optimistic tick increments its own stage')
ok(toggled.stages.find((s) => s.stageKey === 'REVIEW').done === 0,
   'optimistic tick leaves other stages alone')

console.log(fail === 0 ? '\nAll checks passed.\n' : `\n${fail} FAILED\n`)
process.exit(fail ? 1 : 0)
