// User and AuthState look good - they follow frontend convention
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

// LoginCredentials is correctly using PascalCase for .NET backend
export interface LoginCredentials {
    Email: string;    // PascalCase to match .NET backend
    Password: string; // PascalCase to match .NET backend
}

// Fix RegisterCredentials to match .NET backend convention
export interface RegisterCredentials {
    Email: string;       // PascalCase to match .NET backend
    Password: string;    // PascalCase to match .NET backend
    FirstName: string;   // PascalCase to match .NET backend
    LastName: string;    // PascalCase to match .NET backend
}

// AuthResponse and TokenRequest look good
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