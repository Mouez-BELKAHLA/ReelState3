import React, {  useEffect, useReducer } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../Services/AuthService';
import { LoginCredentials, RegisterCredentials, User } from '../Types/Auth';
import AuthContext, { authReducer, initialState } from './AuthContext';

// Rest of your AuthProvider code

// Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [authState, dispatch] = useReducer(authReducer, initialState);
    const navigate = useNavigate();

    // Initialize auth state on mount
    useEffect(() => {
        const initAuth = async () => {
            dispatch({ type: 'AUTH_START' });
            console.log("Initializing auth context...");

            try {
                const token = localStorage.getItem('token');
                console.log("Token in localStorage:", token ? "exists" : "not found");

                if (!token) {
                    console.log("No token found, logging out");
                    dispatch({ type: 'AUTH_LOGOUT' });
                    return;
                }

                // Use stored user data instead of refreshing token
                const userId = localStorage.getItem('userId');
                const email = localStorage.getItem('email');
                const firstName = localStorage.getItem('firstName');
                const lastName = localStorage.getItem('lastName');
                const profilePicture = localStorage.getItem('profilePictureUrl');
                const refreshToken = localStorage.getItem('refreshToken');

                if (userId && email) {
                    console.log("Using stored user data");
                    const user: User = {
                        id: userId,
                        email: email,
                        firstName: firstName || '',
                        lastName: lastName || '',
                        profilePictureUrl: profilePicture || ''
                    };

                    dispatch({
                        type: 'AUTH_SUCCESS',
                        payload: {
                            user,
                            token: token,
                            refreshToken: refreshToken || ''
                        }
                    });
                    return;
                }

                console.log("No stored user data, attempting to refresh token");

                try {
                    const refreshResponse = await authService.refreshToken();
                    console.log("Refresh response:", refreshResponse);

                    if (!refreshResponse || !refreshResponse.isSuccess) {
                        console.log("Token refresh failed, logging out");
                        dispatch({ type: 'AUTH_LOGOUT' });
                        return;
                    }

                    // Success! Set the user in state
                    const user: User = {
                        id: refreshResponse.userId,
                        email: refreshResponse.email,
                        firstName: refreshResponse.firstName,
                        lastName: refreshResponse.lastName,
                        profilePictureUrl: refreshResponse.profilePictureUrl
                    };

                    console.log("Token refresh successful, user:", user);

                    dispatch({
                        type: 'AUTH_SUCCESS',
                        payload: {
                            user,
                            token: refreshResponse.token,
                            refreshToken: refreshResponse.refreshToken
                        }
                    });
                } catch (refreshError) {
                    console.error("Error during token refresh:", refreshError);
                    dispatch({ type: 'AUTH_LOGOUT' });
                }
            } catch (error) {
                console.error("Unhandled error in initAuth:", error);
                dispatch({ type: 'AUTH_LOGOUT' });
            }
        };

        initAuth();

        // Set up axios interceptors for token refresh
        authService.setupInterceptors(() => {
            console.log("Auth interceptor triggered unauthorized callback");
            dispatch({ type: 'AUTH_LOGOUT' });
            navigate('/login');
        });
    }, [navigate]);

    // Login function
    const login = async (credentials: LoginCredentials) => {
        dispatch({ type: 'AUTH_START' });
        console.log("Login attempt with:", credentials.Email);

        try {
            const response = await authService.login(credentials);
            console.log("Login response:", response);

            if (!response.isSuccess) {
                console.error("Login failed:", response.message);
                throw new Error(response.message || 'Login failed');
            }

            // Store user data in localStorage
            localStorage.setItem('userId', response.userId);
            localStorage.setItem('email', response.email);
            localStorage.setItem('firstName', response.firstName || '');
            localStorage.setItem('lastName', response.lastName || '');
            localStorage.setItem('profilePictureUrl', response.profilePictureUrl || '');

            const user: User = {
                id: response.userId,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                profilePictureUrl: response.profilePictureUrl
            };

            console.log("Login successful, user:", user);

            dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                    user,
                    token: response.token,
                    refreshToken: response.refreshToken
                }
            });

            // Navigate to dashboard on successful login
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Login error:", error);
            dispatch({
                type: 'AUTH_ERROR',
                payload: error.message || 'Login failed'
            });
            throw error;
        }
    };

    // Register function
    const register = async (credentials: RegisterCredentials) => {
        dispatch({ type: 'AUTH_START' });
        console.log("Register attempt with:", credentials.Email);

        try {
            const response = await authService.register(credentials);
            console.log("Register response:", response);

            if (!response.isSuccess) {
                console.error("Registration failed:", response.message);
                throw new Error(response.message || 'Registration failed');
            }

            // Store user data in localStorage
            localStorage.setItem('userId', response.userId);
            localStorage.setItem('email', response.email);
            localStorage.setItem('firstName', response.firstName || '');
            localStorage.setItem('lastName', response.lastName || '');
            localStorage.setItem('profilePictureUrl', response.profilePictureUrl || '');

            const user: User = {
                id: response.userId,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                profilePictureUrl: response.profilePictureUrl
            };

            console.log("Registration successful, user:", user);

            dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                    user,
                    token: response.token,
                    refreshToken: response.refreshToken
                }
            });

            // Navigate to dashboard on successful registration
            navigate('/dashboard');
        } catch (error: any) {
            console.error("Registration error:", error);
            dispatch({
                type: 'AUTH_ERROR',
                payload: error.message || 'Registration failed'
            });
            throw error;
        }
    };

    // Google login function
    const googleLogin = async (idToken: string) => {
        dispatch({ type: 'AUTH_START' });
        console.log("Google login attempt with token:", idToken.substring(0, 20) + "...");

        try {
            const response = await authService.googleAuth(idToken);
            console.log("Google login response:", response);

            if (!response.isSuccess) {
                console.error("Google authentication failed:", response.message);
                throw new Error(response.message || 'Google authentication failed');
            }

            const user = {
                id: response.userId,
                email: response.email,
                firstName: response.firstName,
                lastName: response.lastName,
                profilePictureUrl: response.profilePictureUrl
            };

            console.log("Google login successful, user:", user);

            dispatch({
                type: 'AUTH_SUCCESS',
                payload: {
                    user,
                    token: response.token,
                    refreshToken: response.refreshToken
                }
            });

            // Debug navigation issue
            console.log("About to navigate to dashboard...");

            // Force a small delay to ensure state is updated before navigation
            setTimeout(() => {
                console.log("Navigating to dashboard now!");
                navigate('/dashboard');
            }, 100);
        } catch (error: any) {
            console.error("Google login error:", error);
            dispatch({
                type: 'AUTH_ERROR',
                payload: error.message || 'Google authentication failed'
            });
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        console.log("Logout attempt");
        try {
            await authService.logout();
            console.log("Logout successful");
        } finally {
            dispatch({ type: 'AUTH_LOGOUT' });
            navigate('/login');
        }
    };

    // Context value
    const value = {
        authState,
        login,
        register,
        googleLogin,
        logout
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;