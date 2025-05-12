import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../../store/slices/authSlice';

// Update this component to use Redux instead of the auth context
const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // Get auth state from Redux
    const { isAuthenticated, user } = useAppSelector(state => state.auth);

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if there's an error, navigate to login
            navigate('/login');
        }
    };

    // Rest of your Navbar component...
    return (
        <nav className="bg-gray-800 shadow-md">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    {/* Brand */}
                    <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                        <Link to="/" className="flex-shrink-0 flex items-center">
                            <span className="text-white text-xl font-bold">ReelState</span>
                        </Link>
                    </div>

                    {/* Navigation Links - Large Screen */}
                    <div className="hidden sm:block sm:ml-6">
                        <div className="flex space-x-4">
                            <Link to="/feed" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                Feed
                            </Link>
                            {isAuthenticated && (
                                <>
                                    <Link to="/dashboard" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                        Dashboard
                                    </Link>
                                    <Link to="/create" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                        Create
                                    </Link>
                                    <Link to="/profile" className="text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium">
                                        Profile
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* User Menu - Large Screen */}
                    <div className="hidden sm:block absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                        {isAuthenticated ? (
                            <div className="ml-3 relative">
                                <div>
                                    <button
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className="bg-gray-800 flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
                                    >
                                        <img
                                            className="h-8 w-8 rounded-full"
                                            src={user?.profilePictureUrl || "https://via.placeholder.com/40"}
                                            alt="User profile"
                                        />
                                    </button>
                                </div>

                                {isMenuOpen && (
                                    <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                        <div className="px-4 py-2 text-sm text-gray-700 border-b">
                                            <p>Signed in as</p>
                                            <p className="font-medium">{user?.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Your Profile
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex space-x-2">
                                <Link
                                    to="/login"
                                    className="text-white bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Login
                                </Link>
                                <Link
                                    to="/register"
                                    className="text-gray-300 border border-gray-600 hover:bg-gray-700 px-3 py-2 rounded-md text-sm font-medium"
                                >
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="sm:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                        >
                            <span className="sr-only">Open main menu</span>
                            <svg
                                className={`${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            <svg
                                className={`${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`}
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                aria-hidden="true"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                <div className="px-2 pt-2 pb-3 space-y-1">
                    <Link
                        to="/feed"
                        className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Feed
                    </Link>
                    {isAuthenticated ? (
                        <>
                            <Link
                                to="/dashboard"
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/create"
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Create
                            </Link>
                            <Link
                                to="/profile"
                                className="text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Profile
                            </Link>
                            <button
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    handleLogout();
                                }}
                                className="w-full text-left text-gray-300 hover:bg-gray-700 hover:text-white block px-3 py-2 rounded-md text-base font-medium"
                            >
                                Sign out
                            </button>
                        </>
                    ) : (
                        <div className="space-y-1">
                            <Link
                                to="/login"
                                className="text-white bg-blue-600 hover:bg-blue-700 block px-3 py-2 rounded-md text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="text-gray-300 border border-gray-600 hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Register
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;