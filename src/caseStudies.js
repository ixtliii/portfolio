// ─────────────────────────────────────────────────────────
// CASE STUDY REGISTRY
// To add a case study:
//   1. Drop a .md file into src/case-studies/
//   2. Import it below with ?raw
//   3. Add an entry to CASE_STUDIES
// ─────────────────────────────────────────────────────────

import cogoMd from './case-studies/cogo.md?raw'
import marketechoMd from './case-studies/marketecho.md?raw'
import devineMd from './case-studies/devine.md?raw'

export const CASE_STUDIES = {
  'cogo': {
    title: 'Cogo Mobility App',
    subtitle: 'Sole designer on a mobility super-app - redesigning core flows and shipping new features to a live user base across Belgium, the Netherlands & Germany',
    company: 'Mayten Technologies',
    year: '2026',
    role: 'Product & Creative Designer',
    tags: ['Product Design', 'UX/UI', 'Brand', 'Mobile'],
    color: '#eef2ff',
    md: cogoMd,
  },
  'marketecho': {
    title: 'MarketEcho',
    subtitle: 'An analytics dashboard for traders - cutting cognitive load with a scalable design system across app, dashboard and web',
    company: 'MarketEcho',
    year: '2025',
    role: 'Product & UX/UI Designer',
    tags: ['Product Design', 'Design System', 'Dashboard', 'Web'],
    color: '#f0fdf4',
    links: [
      { label: 'Visit the live site', url: 'https://marketecho.io/', primary: true },
      { label: 'View on Behance', url: 'https://www.behance.net/gallery/241398813/MarketEcho-Web-App-UXUI' },
    ],
    md: marketechoMd,
  },
  'bag-that-blooms': {
    title: 'A Bag That Blooms - LOEWE spec concept',
    subtitle: 'A bag that blooms: a 3D campaign concept, modelled and animated in Blender, rising from a garden of gloriosa, alliums and thorned vines',
    company: 'Spec work · DEVINE, Howest',
    year: '2026',
    role: '3D & Motion Design',
    tags: ['Spec work', '3D', 'Motion', 'Blender'],
    color: '#2a1418',
    // shown as a banner under the title and repeated in the footer
    notice: 'Unofficial spec work for a university brief. Not affiliated with, endorsed, sponsored or commissioned by LOEWE.',
    md: devineMd,
  },
  // 'healthcare': { ... }  ← add more here
}

// Ordered list for the homepage grid
export const UX_PROJECT_ORDER = ['cogo', 'marketecho']
