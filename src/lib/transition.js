// ─────────────────────────────────────────────────────────
// Page transitions. Anything that changes page calls
// goTo(path); <PageTransition> (inside the router) covers the
// screen, swaps the route, then reveals the new page.
// Fires `pagego` (detail: { path }) so others (the helper) can react.
// ─────────────────────────────────────────────────────────
export function goTo(path) {
    window.dispatchEvent(new CustomEvent('pagego', { detail: { path } }))
}
