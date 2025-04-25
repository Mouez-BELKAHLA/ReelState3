import tailwindcssPostcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'
import type { Config } from 'postcss-load-config'

const config: Config = {
    plugins: {
        '@tailwindcss/postcss': {},  // Use the new package name here
        autoprefixer: {}
    }
}

export default config