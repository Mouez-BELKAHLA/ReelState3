// Export components
export { default as GoogleSignInButton } from './components/GoogleSignInButton';
export { default as ProtectedRoute } from './components/ProtectedRoute';

// Export pages
export { default as Login } from './pages/Login';
export { default as Register } from './pages/Register';
export { default as UnauthorizedPage } from './pages/UnauthorizedPage';

// Export contexts and providers if needed
export { default as AuthContext } from '../../unused/contexts/AuthContext';
export { default as AuthProvider } from '../../unused/contexts/AuthProvider';

// Export hooks
export { useAuth } from '../../unused/hooks/useAuth';

// Export constants
export * from './Constants/auth';
export * from './Constants/endpoints';

// Export services
export * from './services/AuthService';

// Export types
export * from './types/Auth';
export { authReducer, initialState } from '../../unused/contexts/AuthContext'; // Only if defined there