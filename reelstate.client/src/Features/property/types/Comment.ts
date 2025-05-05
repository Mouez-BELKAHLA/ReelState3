// Add missing properties to your Comment interface
export interface Comment {
    id: string;
    propertyId: string;
    text: string;
    createdAt: string;
    // Add these missing properties
    username: string;
    avatarUrl: string;
    userId?: string; // Optional if needed
}