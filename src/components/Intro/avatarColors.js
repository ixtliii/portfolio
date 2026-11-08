// Shared by the intro and the corner helper: the mascot's colours
// per theme, and where the helper sits on screen.

const AVATAR = {
    light: { a: '#ffffff', b: '#c9c9cd', c: '#8f8f95', ink: '#151517', glint: '#ffffff' },
    dark:  { a: '#6a6a6f', b: '#2c2c2f', c: '#151517', ink: '#0e0e0f', glint: '#1b1b1d' },
}

export const avatarPalette = () =>
    AVATAR[document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light']

// the helper's box, bottom-right (the intro flies the mascot into it)
export const helperBox = () => {
    const small = window.matchMedia('(max-width: 700px)').matches
    return { size: small ? 88 : 116, right: small ? 10 : 18, bottom: small ? 8 : 12 }
}
