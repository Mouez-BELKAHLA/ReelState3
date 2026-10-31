export {};

declare global {
    interface Window {
        // Google Identity Services (sign-in) and Google Maps both attach to window.google
        google: any;
        initMap: () => void;
    }
}