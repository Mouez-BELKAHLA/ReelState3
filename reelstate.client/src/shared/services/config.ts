// src/shared/services/config.ts

// Get API base URL that works for both local and network access
const getApiBaseUrl = () => {
    const hostname = window.location.hostname;
    const backendPort = '5034';

    // Replace localhost with current hostname to support mobile access
    return `http://${hostname}:${backendPort}`;
};

export const API_URL = getApiBaseUrl();
console.log('Using API URL:', API_URL);