import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleSignInButton, FacebookSignInButton } from '..'; // Import from barrel file
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { loginUser, setAuthError } from '../../../store/slices/authSlice';
import { LoginCredentials } from '../types/Auth';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Get auth state from Redux
    const { isLoading, error, isAuthenticated, user } = useAppSelector(state => state.auth);

    // If user is already authenticated, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Create credentials object with PascalCase property names to match .NET backend
            const credentials: LoginCredentials = {
                Email: email,
                Password: password
            };

            // Dispatch login action
            const result = await dispatch(loginUser(credentials)).unwrap();
            console.log('Login successful, roles:', result.roles);
            console.log('Full login response:', result);

            navigate('/dashboard');
        } catch (err: unknown) {
            // Error handling is automatic through the Redux slice
            console.error('Login failed:', err);
        }
    };

    // Debug output for user
    useEffect(() => {
        if (user) {
            console.log('Current user:', user);
            console.log('User roles:', user.roles);
        }
    }, [user]);

    // Clear errors when component unmounts
    useEffect(() => {
        return () => {
            dispatch(setAuthError(null));
        };
    }, [dispatch]);

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Sign in to ReelState</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Or{' '}
                        <Link to="/register" className="font-medium text-blue-700 hover:text-blue-800">
                            create an account
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors flex justify-center"
                        >
                            {isLoading ? "Signing in..." : "Sign in with Email"}
                        </button>
                    </div>

                    <div className="relative flex items-center my-4">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-600">or</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <div className="space-y-3">
                        <GoogleSignInButton />
                        <FacebookSignInButton />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;