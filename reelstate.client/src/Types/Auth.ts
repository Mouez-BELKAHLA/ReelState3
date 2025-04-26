export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface LoginCredentials {
    Email: string;    // PascalCase to match .NET backend
    Password: string; // PascalCase to match .NET backenda
}

export interface RegisterCredentials {
    Email(arg0: string, Email: any): unknown;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
}

export interface AuthResponse {
    isSuccess: boolean;
    message?: string;
    token: string;
    refreshToken: string;
    expiration: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
}

export interface TokenRequest {
    token: string;
    refreshToken: string;
}