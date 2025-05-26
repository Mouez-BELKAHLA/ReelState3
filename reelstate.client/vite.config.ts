import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0', // Allow connections from all IP addresses
        port: 5174,      // Explicitly set the port
        proxy: {
            '/api': {
                target: 'http://localhost:5034',
                changeOrigin: true,
                secure: false,
                // Add logging for debugging
                configure: (proxy, _options) => {
                    proxy.on('error', (err, _req, _res) => {
                        console.log('Proxy error:', err);
                    });
                }
            }
        },
        allowedHosts: [
            'localhost',
            '6647-160-156-96-136.ngrok-free.app',
            '.ngrok-free.app'
        ]
    }
})