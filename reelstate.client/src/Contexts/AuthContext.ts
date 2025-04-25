import { createContext } from 'react';
import {
    AuthState,
    LoginCredentials,
    RegisterCredentials,
    User
} from '../Types/Auth';

// Define Action Types
export type AuthAction =
    | { type: 'AUTH_START' }
    | { type: 'AUTH_SUCCESS'; payload: { user: User; token: string; refreshToken: string } }
    | { type: 'AUTH_ERROR'; payload: string }
    | { type: 'AUTH_LOGOUT' };

// Define Context Type
export interface AuthContextType {
    authState: AuthState;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (credentials: RegisterCredentials) => Promise<void>;
    googleLogin: (idToken: string) => Promise<void>;
    logout: () => Promise<void>;
}

// Initial State
export const initialState: AuthState = {
    user: null,
    token: null,
    refreshToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
};

// Reducer Function
export const authReducer = (state: AuthState, action: AuthAction): AuthState => {
    switch (action.type) {
        case 'AUTH_START':
            return {
                ...state,
                isLoading: true,
                error: null
            };
        case 'AUTH_SUCCESS':
            return {
                ...state,
                isAuthenticated: true,
                isLoading: false,
                user: action.payload.user,
                token: action.payload.token,
                refreshToken: action.payload.refreshToken,
                error: null
            };
        case 'AUTH_ERROR':
            return {
                ...state,
                isLoading: false,
                isAuthenticated: false,
                user: null,
                token: null,
                refreshToken: null,
                error: action.payload
            };
        case 'AUTH_LOGOUT':
            return {
                ...initialState,
                isLoading: false
            };
        default:
            return state;
    }
};

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export default AuthContext;