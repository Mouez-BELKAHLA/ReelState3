import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleSignInButton } from '..';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { registerUser, setAuthError } from '../../../store/slices/authSlice';
import { isValidationError } from '../../../shared/helpers';

const Register: React.FC = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Get auth state from Redux
    const { isLoading, error, isAuthenticated } = useAppSelector(state => state.auth);

    // If user is already authenticated, redirect to dashboard
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setFieldErrors({});

        // Validate passwords match
        if (password !== confirmPassword) {
            setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
            return;
        }

        // Validate password strength
        const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[a-z]).{8,}$/;
        if (!passwordRegex.test(password)) {
            setFieldErrors(prev => ({
                ...prev,
                password: 'Password must be at least 8 characters with uppercase, lowercase, and numbers'
            }));
            return;
        }

        try {
            await dispatch(registerUser({
                Email: email,
                Password: password,
                FirstName: firstName,
                LastName: lastName
            })).unwrap();

            // Navigation will happen automatically due to the isAuthenticated effect
        } catch (err: any) {
            if (isValidationError(err)) {
                // Handle field-specific validation errors
                const newFieldErrors: Record<string, string> = {};

                Object.entries(err.errors).forEach(([field, messages]) => {
                    // Convert to camelCase for frontend field matching
                    const fieldName = field.charAt(0).toLowerCase() + field.slice(1);
                    newFieldErrors[fieldName] = Array.isArray(messages) ? messages[0] : messages;
                });

                setFieldErrors(newFieldErrors);
            }
        }
    };

    // Clear errors when component unmounts
    useEffect(() => {
        return () => {
            dispatch(setAuthError(null));
        };
    }, [dispatch]);

    // Rest of the component remains the same
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
                {/* Form remains the same */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">Create an account</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-blue-700 hover:text-blue-800">
                            Sign in
                        </Link>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleRegister}>
                    {/* Form fields remain the same */}
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                id="firstName"
                                name="firstName"
                                type="text"
                                required
                                className={`w-full px-4 py-2 border ${fieldErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700`}
                                placeholder="First Name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                            />
                            {fieldErrors.firstName && (
                                <p className="mt-1 text-xs text-red-500">{fieldErrors.firstName}</p>
                            )}
                        </div>
                        <div className="flex-1">
                            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                id="lastName"
                                name="lastName"
                                type="text"
                                required
                                className={`w-full px-4 py-2 border ${fieldErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700`}
                                placeholder="Last Name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                            />
                            {fieldErrors.lastName && (
                                <p className="mt-1 text-xs text-red-500">{fieldErrors.lastName}</p>
                            )}
                        </div>
                    </div>

                    {/* Rest of the form fields */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className={`w-full px-4 py-2 border ${fieldErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700`}
                            placeholder="Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                        {fieldErrors.email && (
                            <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input
                            id="password"
                            name="password"
                            type="password"
                            required
                            className={`w-full px-4 py-2 border ${fieldErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700`}
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {fieldErrors.password ? (
                            <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>
                        ) : (
                            <p className="mt-1 text-xs text-gray-500">
                                Must be at least 8 characters with uppercase, lowercase, and numbers
                            </p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            required
                            className={`w-full px-4 py-2 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-blue-700`}
                            placeholder="Confirm Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {fieldErrors.confirmPassword && (
                            <p className="mt-1 text-xs text-red-500">{fieldErrors.confirmPassword}</p>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full px-4 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors flex justify-center"
                        >
                            {isLoading ? "Creating account..." : "Register with Email"}
                        </button>
                    </div>

                    <div className="relative flex items-center my-4">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="flex-shrink mx-4 text-gray-600">or</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                    </div>

                    <div>
                        <GoogleSignInButton variant="signup_with" />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;