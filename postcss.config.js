export default {
    plugins: {
        '@tailwindcss/postcss': {},
        autoprefixer: {}, // Autoprefixer is actually included in @tailwindcss/postcss often, but keeping it is usually fine or explicit.
        // Wait, v4 documentation says just @tailwindcss/postcss.
        // But the error says "install @tailwindcss/postcss". This usually implies v4 or a bridge.
        // If using v3, we stick to tailwindcss.
        // The error "The PostCSS plugin has moved..." is characteristic of Tailwind v4.
        // I should check if I installed v4 by accident (latest tag?).
        // If so, v4 uses @tailwindcss/postcss.
    },
}
