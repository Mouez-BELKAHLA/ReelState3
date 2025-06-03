/**
 * Utility functions for navigating to videos in the feed
 * Can be used across different components like Profile, Dashboard, Comments, etc.
 */

export interface VideoNavigationOptions {
    propertyId: string;
    userId?: string;
    source?: 'profile' | 'dashboard' | 'comment' | 'notification' | 'other';
    openInNewTab?: boolean;
}

/**
 * Navigate to the feed page with a specific video/property
 * @param options - Navigation options including propertyId and source
 */
export const navigateToVideo = (options: VideoNavigationOptions): void => {
    const { propertyId, userId, source = 'other', openInNewTab = false } = options;

    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
        console.warn('Navigation called in non-browser environment');
        return;
    }

    // Construct the URL with query parameters to ensure it opens the correct video
    const params = new URLSearchParams();
    params.set('property', propertyId);

    if (userId) {
        params.set('user', userId);
    }

    if (source) {
        params.set('source', source);
    }

    // Add a timestamp to ensure URL uniqueness and force navigation
    params.set('t', Date.now().toString());

    const url = `/feed?${params.toString()}`;

    console.log(`Navigating to video: ${propertyId} from ${source}. URL: ${url}`);

    try {
        if (openInNewTab) {
            window.open(url, '_blank');
        } else {
            // Use React Router navigation if available, otherwise fallback to location.href
            if (window.history && window.history.pushState) {
                window.history.pushState({}, '', url);
                // Trigger a popstate event to notify React Router
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                window.location.href = url;
            }
        }
    } catch (error) {
        console.error('Navigation error:', error);
        // Fallback to basic navigation
        window.location.href = url;
    }
};

/**
 * Navigate to a user's profile
 * @param userId - The user ID to navigate to
 * @param openInNewTab - Whether to open in a new tab
 */
export const navigateToProfile = (userId: string, openInNewTab: boolean = false): void => {
    if (typeof window === 'undefined') {
        console.warn('Navigation called in non-browser environment');
        return;
    }

    const url = `/profile/${userId}`;

    console.log(`Navigating to profile: ${userId}`);

    try {
        if (openInNewTab) {
            window.open(url, '_blank');
        } else {
            if (window.history && window.history.pushState) {
                window.history.pushState({}, '', url);
                window.dispatchEvent(new PopStateEvent('popstate'));
            } else {
                window.location.href = url;
            }
        }
    } catch (error) {
        console.error('Profile navigation error:', error);
        window.location.href = url;
    }
};

/**
 * Share a video URL
 * @param propertyId - The property ID to share
 * @param userId - Optional user ID
 * @returns The shareable URL
 */
export const getShareableVideoUrl = (propertyId: string, userId?: string): string => {
    if (typeof window === 'undefined') {
        return '';
    }

    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    params.set('property', propertyId);

    if (userId) {
        params.set('user', userId);
    }

    return `${baseUrl}/feed?${params.toString()}`;
};

/**
 * Copy video URL to clipboard
 * @param propertyId - The property ID to copy
 * @param userId - Optional user ID
 */
export const copyVideoUrlToClipboard = async (propertyId: string, userId?: string): Promise<void> => {
    if (typeof window === 'undefined') {
        console.warn('Clipboard operation called in non-browser environment');
        return;
    }

    try {
        const url = getShareableVideoUrl(propertyId, userId);

        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(url);
            console.log(`Video URL copied to clipboard: ${url}`);
        } else {
            // Fallback for older browsers or non-secure contexts
            const textArea = document.createElement('textarea');
            textArea.value = url;
            textArea.style.position = 'absolute';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    console.log(`Video URL copied to clipboard: ${url}`);
                } else {
                    throw new Error('execCommand failed');
                }
            } catch (err) {
                console.error('Fallback clipboard copy failed:', err);
                throw err;
            } finally {
                document.body.removeChild(textArea);
            }
        }
    } catch (error) {
        console.error('Failed to copy URL to clipboard:', error);
        throw error;
    }
};