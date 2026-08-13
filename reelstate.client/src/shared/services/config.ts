// src/shared/services/config.ts
// Get API base URL that works for local, network access, and production
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;

    // Production (Vercel) — use the live Render backend
    if (hostname.includes('vercel.app') || hostname === 'yourdomain.com') {
        return 'https://reelstate3.onrender.com';
    }

    // Special handling for ngrok to avoid mixed content errors
    if (hostname.includes('ngrok')) {
        // When on ngrok, return empty string (not /api) to avoid path duplication
        // Your service files are already adding /api to the paths
        return '';
    }

    // For localhost and direct IP access (keep existing behavior)
    const backendPort = '5034';
    return `http://${hostname}:${backendPort}`;
};

export const API_URL = getApiBaseUrl();
console.log('Using API URL:', API_URL);