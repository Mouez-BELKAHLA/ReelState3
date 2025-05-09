/**
 * Safely extracts message from any error object
 * @param error Any caught error
 * @param fallbackMessage Optional custom fallback message
 * @returns A string error message
 */
export const getErrorMessage = (
    error: unknown,
    fallbackMessage = 'An unexpected error occurred'
): string => {
    // Error instance - use its message property
    if (error instanceof Error) {
        return error.message;
    }

    // Error-like object with message property
    if (error && typeof error === 'object' && 'message' in error &&
        typeof (error as Record<string, unknown>).message === 'string') {
        return (error as { message: string }).message;
    }

    // String error
    if (typeof error === 'string') {
        return error;
    }

    // Fallback for other cases
    return fallbackMessage;
};

/**
 * Helper to handle authentication errors with appropriate messages
 * @param error The caught error
 * @param context The authentication context (login, registration, etc.)
 * @returns A user-friendly error message
 */
export const handleAuthError = (
    error: unknown,
    context: 'login' | 'registration' | 'refresh' | 'google'
): string => {
    const baseMessage = getErrorMessage(error);

    // Return context-specific error message
    switch (context) {
        case 'login':
            return baseMessage || 'Login failed. Please check your credentials and try again.';
        case 'registration':
            return baseMessage || 'Registration failed. Please try again.';
        case 'refresh':
            return baseMessage || 'Your session has expired. Please log in again.';
        case 'google':
            return baseMessage || 'Google authentication failed. Please try again.';
        default:
            return baseMessage;
    }
};