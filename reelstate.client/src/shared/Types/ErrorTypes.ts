// Define specific error types for different API errors
export interface ValidationError {
    type: 'validation';
    errors: Record<string, string[]>;
    message: string;
}

export interface AuthenticationError {
    type: 'authentication';
    message: string;
    code?: string;
}

export interface NetworkError {
    type: 'network';
    message: string;
    status?: number;
}

export type AppError = ValidationError | AuthenticationError | NetworkError;

// Helper to check if error is a specific type
export function isValidationError(error: unknown): error is ValidationError {
    return (error as ValidationError)?.type === 'validation';
}

export function isAuthenticationError(error: unknown): error is AuthenticationError {
    return (error as AuthenticationError)?.type === 'authentication';
}

export function isNetworkError(error: unknown): error is NetworkError {
    return (error as NetworkError)?.type === 'network';
}