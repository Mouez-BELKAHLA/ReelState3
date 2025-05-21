export interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    profilePictureUrl?: string;
    displayName?: string;
    roles?: string[]; // Add this field for roles
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

// AuthResponse to include roles
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
    roles?: string[]; // Add this field for roles
}

export interface TokenRequest {
    token: string;
    refreshToken: string;
}