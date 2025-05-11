import { AppError, ValidationError, AuthenticationError, NetworkError, ApiErrorResponse } from '../Types/ErrorTypes';
import axios, { AxiosError } from 'axios';

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
    // First check if it's one of our AppError types
    if (isAppError(error)) {
        return error.message;
    }

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
 * Helper function to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
    const typedError = error as AppError;
    return typedError?.type === 'validation' ||
        typedError?.type === 'authentication' ||
        typedError?.type === 'network';
}

/**
 * Helper to check if error is a validation error
 */
export function isValidationError(error: unknown): error is ValidationError {
    return (error as ValidationError)?.type === 'validation';
}

/**
 * Helper to check if error is an authentication error
 */
export function isAuthenticationError(error: unknown): error is AuthenticationError {
    return (error as AuthenticationError)?.type === 'authentication';
}

/**
 * Helper to check if error is a network error
 */
export function isNetworkError(error: unknown): error is NetworkError {
    return (error as NetworkError)?.type === 'network';
}

/**
 * Enhanced helper to handle authentication errors with appropriate typed errors
 * @param error The caught error
 * @param context The authentication context (login, registration, etc.)
 * @returns A typed AppError with appropriate context
 */
export const handleAuthError = (
    error: unknown,
    context: 'login' | 'registration' | 'refresh' | 'google'
): string => { // Changed return type to string for backward compatibility
    // Get the appropriate AppError
    const appError = processAuthError(error, context);

    // Just return the message for backward compatibility
    return appError.message;
};

/**
 * Process authentication errors with full type information
 * @param error The caught error
 * @param context The authentication context
 * @returns A typed AppError
 */
export const processAuthError = (
    error: unknown,
    context: 'login' | 'registration' | 'refresh' | 'google'
): AppError => {
    // If it's already an AppError, just return it
    if (isAppError(error)) {
        return error;
    }

    // If it's an axios error, process it to the right type
    if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<ApiErrorResponse>;

        // Check if this is a validation error from .NET (typically 400 with errors collection)
        if (axiosError.response?.status === 400 &&
            axiosError.response.data?.errors) {
            return {
                type: 'validation',
                errors: axiosError.response.data.errors,
                message: axiosError.response.data.message || getContextMessage(context, 'validation')
            };
        }

        // Check if this is an authentication error (401, 403)
        if (axiosError.response?.status === 401 || axiosError.response?.status === 403) {
            return {
                type: 'authentication',
                message: axiosError.response.data?.message || getContextMessage(context, 'authentication'),
                code: axiosError.response.status.toString()
            };
        }

        // Network or server errors
        return {
            type: 'network',
            message: axiosError.response?.data?.message || getContextMessage(context, 'network'),
            status: axiosError.response?.status
        };
    }

    // For other errors, default to network error with context-specific message
    return {
        type: 'network',
        message: getContextMessage(context, 'unknown')
    };
};


/**
 * Helper to get context-specific messages
 */
function getContextMessage(
    context: 'login' | 'registration' | 'refresh' | 'google',
    errorType: 'validation' | 'authentication' | 'network' | 'unknown'
): string {
    switch (context) {
        case 'login':
            return errorType === 'validation'
                ? 'Please check your login credentials.'
                : 'Login failed. Please try again.';
        case 'registration':
            return errorType === 'validation'
                ? 'Please check your registration information.'
                : 'Registration failed. Please try again.';
        case 'refresh':
            return 'Your session has expired. Please log in again.';
        case 'google':
            return 'Google authentication failed. Please try again.';
        default:
            return 'An unexpected error occurred.';
    }
}