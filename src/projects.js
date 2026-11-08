// ─────────────────────────────────────────────────────────
// PROJECT ARCHIVE — single source of truth for the homepage
// To add a project: append an entry. Order here = order in the drum.
//   kind:  'case'       → product / UX work
//          'playground' → experiments & creative coding
//   link:  { slug }     → internal case study (/work/:slug)
//          { url }      → external page (opens in new tab)
// ─────────────────────────────────────────────────────────

export const PROJECTS = [
    {
        title: 'Cogo Mobility App',
        kind: 'case',
        company: 'Mayten Technologies',
        year: '2026',
        role: 'Product & Creative Designer',
        summary: 'Sole designer on a mobility super-app — redesigning core flows and shipping new features to a live user base across Belgium, the Netherlands & Germany.',
        tags: ['Product Design', 'Brand', 'Mobile'],
        image: '/prevs/cogo.jpg',
        color: '#dfe7fa',
        link: { slug: 'cogo', label: 'Read case study' },
    },
    {
        title: 'MarketEcho',
        kind: 'case',
        company: 'MarketEcho',
        year: '2025',
        role: 'Product & UX/UI Designer',
        summary: 'An analytics dashboard for traders — cutting cognitive load with a scalable design system across app, dashboard and web.',
        tags: ['Design System', 'Dashboard', 'Web'],
        image: '/prevs/marketEcho.jpg',
        color: '#def3e6',
        link: { url: 'https://www.behance.net/gallery/241398813/MarketEcho-Web-App-UXUI', label: 'View on Behance' },
    },
    {
        title: 'OCare',
        kind: 'case',
        company: 'Mental Health',
        year: '2025',
        role: 'UX/UI Designer',
        summary: 'A mental-health companion app — from UX research to a calm, accessible mobile interface.',
        tags: ['UX Research', 'Mobile'],
        image: '/prevs/ocare.png',
        color: '#f4e3f8',
        link: { url: 'https://www.behance.net/gallery/241707793/OCare-Mental-Health-UXUI', label: 'View on Behance' },
    },
    {
        title: 'Antwerp Unseen',
        kind: 'playground',
        company: 'Antwerp Visit × Howest',
        year: '2026',
        role: 'Interaction Design & Dev',
        summary: 'A phygital street installation where passers-by shape a shared, anonymous archive of urban memory through real-time body tracking — the crowd becomes the interface.',
        tags: ['Interaction Design', 'Three.js', 'MediaPipe'],
        image: '/prevs/antwerp-unseen.jpg',
        color: '#12121e',
        link: { url: 'https://antwerp-unseen.vercel.app/', label: 'Visit project' },
    },
    {
        title: 'The Couturier’s Code',
        kind: 'playground',
        company: 'MoMu × Howest',
        year: '2026',
        role: 'Interactive Story',
        summary: 'A scroll-driven story on Christian Dior’s superstitions — lucky charms, fortune-tellers and the botanical symbolism behind the New Look.',
        tags: ['Interactive Story', 'WebGL', 'Editorial'],
        image: '/prevs/couturiers-code.jpg',
        color: '#f2efe9',
        link: { url: 'https://ixtliii.github.io/dior-impress/', label: 'Visit project' },
    },
    {
        title: 'Synesthesia',
        kind: 'playground',
        company: 'Personal',
        year: '2026',
        role: 'Creative Coding',
        summary: 'A glitch-editorial, audio-reactive piece that turns your microphone into visual frequency — so you feel what it’s like when sound leaks into sight.',
        tags: ['Experimental', 'Audio-reactive'],
        image: '/prevs/synesthesia.jpg',
        color: '#101018',
        link: { url: 'https://artem-diakunchak.be/personal-experience/', label: 'Visit project' },
    },
]

export const KIND_LABEL = {
    case: 'Product work',
    playground: 'Playground',
}
