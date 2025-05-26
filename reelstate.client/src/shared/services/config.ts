// src/shared/services/config.ts

// Get API base URL that works for both local and network access
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;

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