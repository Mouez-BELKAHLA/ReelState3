// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

import type { Config } from 'tailwindcss'

export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#1E40AF",
                secondary: "#10B981",
            },
        },
    },
    plugins: [],
} satisfies Config
