// Export components
export { default as GoogleSignInButton } from './components/GoogleSignInButton';
export { default as ProtectedRoute } from './components/ProtectedRoute';

// Export pages - fixed casing to match actual directory structure
export { default as Login } from './Pages/Login';
export { default as Register } from './Pages/Register';
export { default as UnauthorizedPage } from './Pages/UnauthorizedPage';

// Export constants
export * from './Constants/auth';
export * from './Constants/endpoints';

// Export services
export * from './services/AuthService';

// Export types
export * from './types/Auth';

// Export utilities
export * from './utiles/AuthUtils';

// Remove unused exports that point to the unused directory
// These should be imported directly if needed elsewhere
// export { default as AuthContext } from '../../unused/contexts/AuthContext';
// export { default as AuthProvider } from '../../unused/contexts/AuthProvider';
// export { useAuth } from '../../unused/hooks/useAuth';
// export { authReducer, initialState } from '../../unused/contexts/AuthContext';