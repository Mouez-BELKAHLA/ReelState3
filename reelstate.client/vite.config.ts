import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [
        react(),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'https://localhost:7096', // Update with your ASP.NET Core port
                changeOrigin: true,
                secure: false
            }
        }
    }
})