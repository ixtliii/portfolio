// ─────────────────────────────────────────────────────────
// Sending a message from the contact card.
//
// Messages go to Artem's inbox through FormSubmit (formsubmit.co):
// a free form-to-email relay, no account or backend needed.
//   • The very first submission sends a one-time confirmation email
//     to EMAIL. Click "Activate" in it; anything sent before that is
//     held and delivered once confirmed.
//   • After activating, FormSubmit also emails a random alias. Put it
//     in .env as VITE_CONTACT_ENDPOINT=https://formsubmit.co/ajax/<alias>
//     to keep the raw address out of the site's code.
// VITE_CONTACT_ENDPOINT can also point to any other JSON form endpoint
// (Formspree etc.).
// ─────────────────────────────────────────────────────────
export const EMAIL = 'artem.diakunchak.work@gmail.com'
const ENDPOINT = import.meta.env.VITE_CONTACT_ENDPOINT || `https://formsubmit.co/ajax/${EMAIL}`

export async function submitMessage({ name, email, message }) {
    try {
        const r = await fetch(ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
                name,
                email,
                message,
                _replyto: email,                                  // hitting "reply" answers the visitor
                _subject: `Portfolio message from ${name}`,
                _template: 'table',
                _captcha: 'false',
            }),
        })
        const data = await r.json().catch(() => ({}))
        // FormSubmit answers { success: "true" }; before activation it says the form
        // needs activating - the message is held and delivered after, so that's a send too
        const pending = /activat/i.test(data?.message || '')
        const ok = r.ok && (data?.success === true || data?.success === 'true' || pending || data?.ok === true || data?.success === undefined)
        return { ok, pending }
    } catch {
        return { ok: false }
    }
}

export const openContact = () => window.dispatchEvent(new CustomEvent('contact:open'))
