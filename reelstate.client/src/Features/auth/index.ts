// Export components
export { default as GoogleSignInButton } from './components/GoogleSignInButton';
export { default as ProtectedRoute } from './components/ProtectedRoute';

// Export pages
export { default as Login } from './Pages/Login';
export { default as Register } from './Pages/Register';

// Export contexts and providers
export { default as AuthContext } from './contexts/AuthContext';
export { default as AuthProvider } from './contexts/AuthProvider';

// Export hooks
export { useAuth } from './hooks/useAuth';

// Export constants
export * from './Constants/auth';
export * from './Constants/endpoints';

// Export services
export * from './services/AuthService';

// Export types
export * from './types/Auth';
export { authReducer, initialState } from './contexts/AuthContext'; // Assuming they're defined there

