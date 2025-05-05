/**
 * Interface for ApplicationUser (matching your C# ApplicationUser)
 * Represents user data from the backend
 */
export interface ApplicationUser {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
    profilePictureUrl?: string;
}

// Add other shared user types here