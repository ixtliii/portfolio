// ─────────────────────────────────────────────────────────
// About page copy. Edit freely: the page is built from this.
// ─────────────────────────────────────────────────────────

// Drop your photo at public/about/portrait.jpg (portrait, ~4:5).
// Until it's there, a dotted placeholder silhouette is shown.
export const PORTRAIT = 'about/portrait.jpg'

export const HELLO = {
    first: 'Artem',
    last: 'Diakunchak',
    stickers: ['Product designer', 'Design × code', '2.5+ years shipping', 'Data-heavy products'],
    line: ['Thinks in systems', 'Builds in code', 'At home in data-heavy products'],
}

// Selected work on the home page (looked up in src/projects.js by title).
// `to` = internal case study, `url` = external page. `blurb` overrides the summary,
// `focus` sets which part of the image stays in view when it's cropped, `zoom` crops in from the top.
export const FEATURED = [
    { title: 'Cogo Mobility App', to: '/work/cogo', focus: '50% 30%', blurb: 'Sole designer on a mobility super-app, redesigning core flows for a live user base across three countries.' },
    { title: 'MarketEcho', to: '/work/marketecho', zoom: 1.3, blurb: 'An analytics dashboard for traders, built on a scalable design system that cuts cognitive load.' },
    { title: 'Antwerp Unseen', zoom: 1.16, zoomFrom: '50% 50%', url: 'https://antwerp-unseen.vercel.app/', blurb: 'A street installation where passers-by shape a shared archive through real-time body tracking.' },
]

// [text, key?] - a key turns the phrase into a chip the mascot can comment on
export const BIO = [
    [['Product designer with '], ['2.5+ years', 'Two and a half years of shipping, and counting.'], [' of turning complex, '], ['data-heavy products', 'Dense data, calm screens. My favourite puzzle.'], [' into interfaces that feel clear and calm.']],
    [['Thinking in systems and building in code, I close the gap between '], ['design and engineering', 'Half Figma, half terminal.'], [', so what ships is what was designed: a '], ['50+ component design system', 'Fifty-plus components. I counted.'], [', an app redesign live in '], ['60+ regions', 'One redesign, sixty-plus regions.'], [', a real-time street installation.']],
]

export const JOURNEY = [
    { year: '2024', role: 'Web Designer', company: 'Carnivale', note: 'Where the client work started.', grad: ['#fff6ec', '#ffcca3', '#e3875a'] },
    { year: '2025', role: 'UX/UI Designer', company: 'MarketEcho', note: 'A product users called clean and enjoyable.', grad: ['#f9f2ff', '#d4c0ff', '#8e72dc'] },
    { year: '2026', role: 'Product Designer', company: 'Mayten Technologies', note: 'Design systems, features from first sketch to launch.', grad: ['#f1fff4', '#b6ebc6', '#62b884'], now: true },
]

export const SKILLS = [
    { category: 'Design', grad: ['#f1fff4', '#b6ebc6', '#62b884'], items: ['Product Design', 'UX/UI', 'Design Systems', 'Interaction Design', 'User Research', 'Prototyping'] },
    { category: 'Code', grad: ['#f9f2ff', '#d4c0ff', '#8e72dc'], items: ['React', 'Vite', 'GSAP', 'Three.js', 'HTML/CSS/JS', 'Supabase'] },
    { category: 'Tools', grad: ['#fff6ec', '#ffcca3', '#e3875a'], items: ['Figma', 'Adobe CC', 'Miro', 'Jira', 'GitHub'] },
]

export const WORDS_TITLE = ["People I've", 'worked with']
export const WORDS_LINE = "Kind words from the founders and developers I've built products with."

export const WORDS = [
    {
        quote: 'As a co-founder of MarketEcho, I can highlight Artem as a highly responsible and dedicated UI/UX designer. He worked fast, met all deadlines, and consistently delivered high-quality results. The design received fantastic feedback from our users - many highlighted how clean, intuitive, and enjoyable the product feels to use.',
        name: 'Serhiy Amelin', title: 'Co-founder, MarketEcho', grad: ['#f9f2ff', '#d4c0ff', '#8e72dc'],
    },
    {
        quote: 'He has shown his great talent and attention to details while being able to communicate with both clients and developers. Thanks to his technical background he could easily translate business requirements to design implementations that were both realistic and fulfilled all client requirements.',
        name: 'Leonid Romaniukha', title: 'Full Stack Developer, Mayten', grad: ['#f1fff4', '#b6ebc6', '#62b884'],
    },
]

// what the corner mascot says as each chapter comes into view (it's Artem, so: first person)
export const GUIDE = {
    hello: "Hi, that's me. Well, the human version. Scroll, I'll show you around.",
    work: 'My favourite three. The rest live in the archive.',
    bio: 'The short version. Poke the highlights.',
    journey: "Where I've been so far.",
    skills: 'My toolbox. Tap a group to light it up.',
    words: "Don't just take my word for it.",
    outro: 'Your turn!',
}
