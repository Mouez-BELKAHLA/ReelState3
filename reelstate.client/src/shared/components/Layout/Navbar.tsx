import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../../store/slices/authSlice';
import { NotificationBadge } from '../../../Features/notification';
import { markNotificationAsRead } from '../../../store/slices/notificationSlice';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    // Get state from Redux
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const { notifications, unreadCount } = useAppSelector(state => state.notifications);

    // States for dropdowns
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);

    // Refs for handling click outside dropdowns
    const notificationRef = useRef<HTMLDivElement>(null);
    const profileRef = useRef<HTMLDivElement>(null);

    // Check if user is admin
    const isAdmin = user?.roles?.includes('Admin');

    // Handle outside clicks for dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setNotificationDropdownOpen(false);
            }
            if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await dispatch(logoutUser()).unwrap();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            navigate('/login');
        }
    };

    const isActive = (path: string) => {
        return location.pathname === path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-700 hover:text-blue-600';
    };

    const handleNotificationClick = () => {
        setNotificationDropdownOpen(!notificationDropdownOpen);
    };

    const handleNotificationView = (notificationId: string) => {
        dispatch(markNotificationAsRead(notificationId));
        setNotificationDropdownOpen(false);
        navigate('/notifications');
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                            </svg>
                            <span className="ml-2 text-xl font-bold text-blue-600">ReelState</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link to="/feed" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/feed')}`}>
                            Discover
                        </Link>
                        {isAuthenticated && (
                            <>
                                <Link to="/dashboard" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/dashboard')}`}>
                                    Dashboard
                                </Link>
                                <Link to="/create" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/create')}`}>
                                    Add Listing
                                </Link>
                                <Link to="/profile" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/profile')}`}>
                                    Profile
                                </Link>
                                {isAdmin && (
                                    <Link to="/admin" className={`px-3 py-2 rounded-md text-sm font-medium ${isActive('/admin')}`}>
                                        Admin
                                    </Link>
                                )}
                            </>
                        )}
                    </div>

                    {/* Right side elements */}
                    <div className="hidden md:flex items-center space-x-4">
                        {isAuthenticated ? (
                            <div className="flex items-center space-x-4">
                                {/* Notification with dropdown */}
                                <div className="relative" ref={notificationRef}>
                                    {/* Using our custom NotificationBadge component */}
                                    <div onClick={handleNotificationClick}>
                                        <NotificationBadge onClick={handleNotificationClick} />
                                    </div>

                                    {/* Notification dropdown */}
                                    {notificationDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200 max-h-[500px] overflow-y-auto">
                                            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                                                <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                                                <Link
                                                    to="/notifications"
                                                    className="text-xs text-blue-600 hover:text-blue-800"
                                                    onClick={() => setNotificationDropdownOpen(false)}
                                                >
                                                    View all
                                                </Link>
                                            </div>

                                            {notifications.length === 0 ? (
                                                <div className="px-4 py-6 text-center text-gray-500">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                                    </svg>
                                                    <p className="mt-2 text-sm">No notifications yet</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    {notifications.slice(0, 5).map((notification) => (
                                                        <div
                                                            key={notification.id}
                                                            className={`px-4 py-3 hover:bg-gray-50 flex items-start cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                            onClick={() => handleNotificationView(notification.id)}
                                                        >
                                                            {/* Notification Icon based on type */}
                                                            <div className={`flex-shrink-0 rounded-full p-2 mr-3 ${notification.type === 'like' ? 'bg-red-100 text-red-600' :
                                                                    notification.type === 'comment' ? 'bg-blue-100 text-blue-600' :
                                                                        notification.type === 'follow' ? 'bg-purple-100 text-purple-600' :
                                                                            notification.type === 'property_approved' ? 'bg-green-100 text-green-600' :
                                                                                notification.type === 'property_rejected' ? 'bg-yellow-100 text-yellow-600' :
                                                                                    'bg-gray-100 text-gray-600'
                                                                }`}>
                                                                {notification.type === 'like' && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                {notification.type === 'comment' && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                {notification.type === 'follow' && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                                                    </svg>
                                                                )}
                                                                {notification.type === 'property_approved' && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                                {notification.type === 'property_rejected' && (
                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>

                                                            <div className="flex-1">
                                                                <p className="text-sm">
                                                                    {notification.message}
                                                                </p>
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(notification.createdAt).toLocaleDateString()}
                                                                </p>
                                                            </div>

                                                            {!notification.isRead && (
                                                                <span className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0 mt-2"></span>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {notifications.length > 5 && (
                                                        <div className="px-4 py-2 text-center border-t border-gray-100">
                                                            <Link
                                                                to="/notifications"
                                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                                onClick={() => setNotificationDropdownOpen(false)}
                                                            >
                                                                View all {notifications.length} notifications
                                                            </Link>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* User profile dropdown */}
                                <div className="relative" ref={profileRef}>
                                    <button
                                        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                                        className="flex items-center space-x-2 focus:outline-none"
                                    >
                                        <div className="flex text-sm rounded-full">
                                            {user?.profilePictureUrl ? (
                                                <img
                                                    src={user.profilePictureUrl}
                                                    alt="Profile"
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <span className="text-blue-600 font-bold">
                                                        {user?.firstName?.charAt(0) || "U"}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="hidden md:block">
                                            <div className="text-sm font-medium text-gray-700">
                                                {user?.firstName} {user?.lastName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {user?.email && user.email.length > 20
                                                    ? `${user.email.substring(0, 20)}...`
                                                    : user?.email}
                                            </div>
                                        </div>
                                        <svg
                                            className={`h-4 w-4 text-gray-500 transition-transform ${profileMenuOpen ? "transform rotate-180" : ""
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </button>

                                    {profileMenuOpen && (
                                        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 z-50">
                                            <Link
                                                to="/profile"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setProfileMenuOpen(false)}
                                            >
                                                Your Profile
                                            </Link>
                                            <Link
                                                to="/dashboard"
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                onClick={() => setProfileMenuOpen(false)}
                                            >
                                                Dashboard
                                            </Link>
                                            {isAdmin && (
                                                <Link
                                                    to="/admin"
                                                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                                    onClick={() => setProfileMenuOpen(false)}
                                                >
                                                    Admin Dashboard
                                                </Link>
                                            )}
                                            <div className="border-t border-gray-100 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    setProfileMenuOpen(false);
                                                    handleLogout();
                                                }}
                                                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                            >
                                                Sign out
                                            </button>
                                        </div>
                                    )}
                                </div>
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
                    <div className="flex items-center md:hidden">
                        {isAuthenticated && (
                            <div className="mr-2" onClick={() => navigate('/notifications')}>
                                <NotificationBadge onClick={() => navigate('/notifications')} />
                            </div>
                        )}
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
            <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
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
                            <Link
                                to="/profile"
                                className={`block pl-3 pr-4 py-2 border-l-4 ${location.pathname === '/profile' ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-transparent'}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Profile
                            </Link>
                            <Link
                                to="/notifications"
                                className={`block pl-3 pr-4 py-2 border-l-4 ${location.pathname === '/notifications' ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-transparent'}`}
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Notifications
                            </Link>
                            {isAdmin && (
                                <Link
                                    to="/admin"
                                    className={`block pl-3 pr-4 py-2 border-l-4 ${location.pathname === '/admin' ? 'border-blue-700 text-blue-700 bg-blue-50' : 'border-transparent'}`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Admin Dashboard
                                </Link>
                            )}
                        </>
                    )}
                </div>

                {isAuthenticated ? (
                    <div className="border-t border-gray-200 pt-4 pb-3">
                        <div className="flex items-center px-4">
                            {user?.profilePictureUrl ? (
                                <div className="flex-shrink-0">
                                    <img className="h-10 w-10 rounded-full" src={user.profilePictureUrl} alt="Profile" />
                                </div>
                            ) : (
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                        <span className="text-blue-600 font-bold">{user?.firstName?.charAt(0) || "U"}</span>
                                    </div>
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
                            </Link>d
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
        </nav>
    );
};

export default Navbar;