import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../Hooks/useAuth';

const Navbar: React.FC = () => {
    const { authState, logout } = useAuth();
    const { isAuthenticated, user } = authState;
    const location = useLocation();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-blue-700 font-medium' : 'text-gray-700 hover:text-blue-700';
    };

    return (
        <nav className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and main nav */}
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <Link to="/" className="text-xl font-bold text-blue-700">
                                ReelState
                            </Link>
                        </div>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            {/* Main nav links - always visible */}
                            <Link to="/feed" className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/feed') === 'text-blue-700 font-medium' ? 'border-blue-700' : 'border-transparent'} ${isActive('/feed')}`}>
                                Discover
                            </Link>

                            {/* Links for authenticated users */}
                            {isAuthenticated && (
                                <>
                                    <Link to="/dashboard" className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/dashboard') === 'text-blue-700 font-medium' ? 'border-blue-700' : 'border-transparent'} ${isActive('/dashboard')}`}>
                                        Dashboard
                                    </Link>
                                    <Link to="/create" className={`inline-flex items-center px-1 pt-1 border-b-2 ${isActive('/create') === 'text-blue-700 font-medium' ? 'border-blue-700' : 'border-transparent'} ${isActive('/create')}`}>
                                        Add Listing
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Auth buttons and profile */}
                    <div className="hidden sm:ml-6 sm:flex sm:items-center">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                {/* User info */}
                                <div className="flex items-center">
                                    {user?.profilePictureUrl && (
                                        <img
                                            src={user.profilePictureUrl}
                                            alt="Profile"
                                            className="h-8 w-8 rounded-full object-cover"
                                        />
                                    )}
                                    <div className="ml-2 hidden md:block">
                                        <p className="text-sm font-medium text-gray-900">{user?.firstName?.toUpperCase()} {user?.lastName?.toUpperCase()}</p>
                                    </div>
                                </div>

                                {/* Logout button */}
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors text-sm"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/login"
                                    className="px-4 py-1.5 text-gray-700 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors text-sm"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="flex items-center sm:hidden">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                        >
                            <span className="sr-only">Open main menu</span>
                            {isMenuOpen ? (
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile menu */}
            <div className={`${isMenuOpen ? 'block' : 'hidden'} sm:hidden`}>
                <div className="pt-2 pb-3 space-y-1">
                    <Link
                        to="/feed"
                        className={`block pl-3 pr-4 py-2 border-l-4 ${location.pathname === '/feed' ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-transparent'}`}
                        onClick={() => setIsMenuOpen(false)}
                    >
                        Discover
                    </Link>

                    {isAuthenticated && (
                        <>
                            <Link
                                to="/dashboard"
                                className={`block pl-3 pr-4 py-2 border-l-4 ${location.pathname === '/dashboard' ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-transparent'}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Dashboard
                            </Link>
                            <Link
                                to="/create"
                                className={`block pl-3 pr-4 py-2 border-l-4 ${location.pathname === '/create' ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-transparent'}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Add Listing
                            </Link>
                        </>
                    )}

                    {isAuthenticated ? (
                        <div className="border-t border-gray-200 pt-4 pb-3">
                            <div className="flex items-center px-4">
                                {user?.profilePictureUrl && (
                                    <div className="flex-shrink-0">
                                        <img className="h-10 w-10 rounded-full" src={user.profilePictureUrl} alt="Profile" />
                                    </div>
                                )}
                                <div className="ml-3">
                                    <div className="text-base font-medium text-gray-800">
                                        {user?.firstName} {user?.lastName}
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                                </div>
                            </div>
                            <div className="mt-3 space-y-1">
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="block w-full text-left px-4 py-2 text-red-700 hover:bg-red-50"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-gray-200 pt-4 pb-3">
                            <div className="flex flex-col space-y-3 px-4">
                                <Link
                                    to="/login"
                                    className="block text-center py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="block text-center py-2 px-4 bg-blue-600 border border-transparent rounded-md text-white hover:bg-blue-700"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;