import { useContext } from 'react';
import { AuthContext } from '../../Features/auth';

// ONLY use named export to match your existing imports
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }

    // Add this debug log
    console.log("useAuth hook called, authState:", context.authState);

    return context;
};

// REMOVE the default export to avoid confusion