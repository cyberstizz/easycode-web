/**
 * Portfolio.
 *
 * ONE FILE TO EDIT. Drop screenshots into `public/work/` and set `image` to
 * `/work/<filename>` — the gradient in `shot` is the fallback until you do,
 * so nothing looks broken while you're gathering them.
 *
 * Wording note: these are described as things EasyCode BUILT, not as paying
 * clients. Unis is your own product and DesignHer is family — calling either
 * a client would be a claim a prospect could check and find wanting. "Built by
 * us" is true, verifiable, and does the same job.
 */
export const WORK = [
  {
    slug: 'unis',
    name: 'Unis',
    kind: 'Music platform',
    shot: 'linear-gradient(140deg,#12291F,#1E5040)',
    image: null, // e.g. '/work/unis.png'
    blurb:
      'A hyperlocal music discovery and voting platform — artists upload, neighborhoods vote, and the charts are per-city. React front end, Spring Boot API, real-time voting, and payouts to artists.',
    metrics: [
      { label: 'Built', value: 'Full stack' },
      { label: 'Scope', value: 'Web + mobile' },
    ],
    detail:
      'The hardest part was making local mean something. Charts are scoped to a neighborhood rather than a genre, so a Harlem artist competes with Harlem artists. Voting had to be fast enough to feel live and hard enough to game that the charts stay honest.',
  },
  {
    slug: 'designher',
    name: 'DesignHer Kustom Creations',
    kind: 'Custom apparel',
    shot: 'linear-gradient(140deg,#2A1030,#4E1F52)',
    image: null,
    blurb:
      'Hand-set rhinestone customs sold online. A storefront where every piece is one of a kind, plus an admin she runs herself from her phone — add a piece, price it, mark it sold.',
    metrics: [
      { label: 'Self-managed', value: '100%' },
      { label: 'Built for', value: 'Mobile first' },
    ],
    detail:
      'She works with her hands, not a laptop. So the admin is touch-sized, single-column, and lives on a phone — photograph a finished piece, set a price, and it is live before she puts the glue gun down.',
  },
  {
    slug: 'femme-standard',
    name: 'The Femme Standard',
    kind: 'Fashion resale',
    shot: 'linear-gradient(140deg,#1A1408,#4A3A12)',
    image: null,
    blurb:
      'One-of-one resale fashion, black and gold. Every item is a single unit, so the whole thing is built around scarcity — sold means gone, and the catalogue has to say so instantly.',
    metrics: [
      { label: 'Inventory', value: 'One-of-one' },
      { label: 'Built', value: 'React' },
    ],
    detail:
      'Ordinary e-commerce assumes quantity. When every SKU is a single piece, sold-out state is the common case rather than the edge case, and the design had to make that feel exclusive instead of disappointing.',
  },
]