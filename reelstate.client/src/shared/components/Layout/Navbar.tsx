import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { logoutUser } from '../../../store/slices/authSlice';
import { NotificationBadge } from '../../../Features/notification';
import { markNotificationAsRead } from '../../../store/slices/notificationSlice';
import { NotificationType } from '../../../Features/notification/types/NotificationTypes';
import SearchBar from './SearchBar';

const Navbar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    // Get state from Redux
    const { isAuthenticated, user } = useAppSelector(state => state.auth);
    const { notifications } = useAppSelector(state => state.notifications);

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

    // Helper function to get notification type string for comparison
    const getNotificationTypeString = (type: NotificationType): string => {
        switch (type) {
            case NotificationType.LIKE:
                return 'like';
            case NotificationType.COMMENT:
                return 'comment';
            case NotificationType.FOLLOW:
                return 'follow';
            case NotificationType.PROPERTY_APPROVED:
                return 'property_approved';
            case NotificationType.PROPERTY_REJECTED:
                return 'property_rejected';
            case NotificationType.COMMENT_LIKE:
                return 'comment_like';
            case NotificationType.PROPERTY_VIEW:
                return 'property_view';
            case NotificationType.SYSTEM:
                return 'system';
            default:
                return 'unknown';
        }
    };

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            {/* Custom CSS for animations and styling */}
            <style jsx>{`
                .brand-text {
                    background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                .dropdown-item {
                    position: relative;
                    transition: all 0.2s;
                }
                
                .dropdown-item::before {
                    content: '';
                    position: absolute;
                    left: 0;
                    top: 0;
                    height: 100%;
                    width: 0;
                    background-color: #f3f4f6;
                    transition: width 0.2s ease;
                    z-index: -1;
                }
                
                .dropdown-item:hover::before {
                    width: 100%;
                }
                
                .menu-button {
                    transition: transform 0.3s ease;
                }
                
                .menu-button.active {
                    transform: rotate(90deg);
                }
                
                .profile-avatar {
                    border: 2px solid transparent;
                    background-origin: border-box;
                    background-clip: content-box, border-box;
                    background-image: 
                        linear-gradient(white, white), 
                        linear-gradient(135deg, #3b82f6, #1e3a8a);
                }
                
                .tunisia-shadow {
                    box-shadow: 0 4px 14px -2px rgba(59, 130, 246, 0.2);
                }
                
                @keyframes doorShine {
                    0% { filter: brightness(1); }
                    50% { filter: brightness(1.2) saturate(1.2); }
                    100% { filter: brightness(1); }
                }
                
                .door-animation {
                    animation: doorShine 5s infinite ease-in-out;
                }
                
                .door-knocker {
                    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.4));
                }
            `}</style>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo */}
                    <div className="flex-shrink-0 flex items-center">
                        <Link to="/" className="flex items-center">
                            <div className="relative h-10 w-10 flex-shrink-0">
                                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    {/* Roof */}
                                    <path d="M10 40L50 10L90 40" stroke="#475569" strokeWidth="2" strokeLinecap="round" />

                                    {/* House structure */}
                                    <path d="M20 40V90H80V40" fill="white" stroke="#E2E8F0" strokeWidth="1" />

                                    {/* Main section of the house with tile pattern */}
                                    <rect x="25" y="45" width="50" height="45" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.5" />

                                    {/* Door Area Background */}
                                    <rect x="35" y="50" width="30" height="40" fill="#F1F5F9" rx="2" />

                                    {/* Tunisian Door Frame with Black-White Striped Arch */}
                                    <path d="M35 60C35 54 40 50 50 50C60 50 65 54 65 60V65V90H35V65V60Z" fill="#F1F5F9" />

                                    {/* Black and White Arch Pattern */}
                                    <path d="M35 60C35 54 40 50 50 50C60 50 65 54 65 60" stroke="#111827" strokeWidth="1.5" />
                                    <path d="M38 57.5L41 59.5" stroke="#111827" strokeWidth="1.5" />
                                    <path d="M44 53.5L47 55.5" stroke="#111827" strokeWidth="1.5" />
                                    <path d="M53 53.5L56 55.5" stroke="#111827" strokeWidth="1.5" />
                                    <path d="M59 57.5L62 59.5" stroke="#111827" strokeWidth="1.5" />

                                    {/* White Stripes in Arch */}
                                    <path d="M41 59.5L44 53.5" stroke="white" strokeWidth="1.5" />
                                    <path d="M47 55.5L53 53.5" stroke="white" strokeWidth="1.5" />
                                    <path d="M56 55.5L59 57.5" stroke="white" strokeWidth="1.5" />

                                    {/* Blue Door with decorative studs/patterns */}
                                    <path className="door-animation" d="M38 60V90H62V60C62 56 56 54 50 54C44 54 38 56 38 60Z" fill="#1e88e5" />
                                    <path d="M50 54V90" stroke="#0d47a1" strokeWidth="0.8" />

                                    {/* Decorative studs/nail patterns - similar to the image */}

                                    {/* Star pattern (left) */}
                                    <path d="M44 75L44 73L42 73L44 71L44 69L46 71L48 69L48 71L50 73L48 73L48 75L46 77L44 75Z" stroke="#111827" strokeWidth="0.5" strokeLinecap="round" />

                                    {/* Star pattern (right) */}
                                    <path d="M56 75L56 73L54 73L56 71L56 69L58 71L60 69L60 71L62 73L60 73L60 75L58 77L56 75Z" stroke="#111827" strokeWidth="0.5" strokeLinecap="round" />

                                    {/* Central decorative pattern */}
                                    <line x1="50" y1="60" x2="50" y2="83" stroke="#111827" strokeWidth="0.5" strokeDasharray="0.8 0.8" />

                                    {/* Arcs pattern (left top) */}
                                    <path d="M43 65C44 63 46 63 47 65" stroke="#111827" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="0.8 0.8" />
                                    <path d="M41 65C43 61 47 61 49 65" stroke="#111827" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="0.8 0.8" />

                                    {/* Arcs pattern (right top) */}
                                    <path d="M53 65C54 63 56 63 57 65" stroke="#111827" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="0.8 0.8" />
                                    <path d="M51 65C53 61 57 61 59 65" stroke="#111827" strokeWidth="0.5" strokeLinecap="round" strokeDasharray="0.8 0.8" />

                                    {/* Rectangle with cross (left) */}
                                    <rect x="42" y="80" width="6" height="4" rx="1" stroke="#111827" strokeWidth="0.5" strokeDasharray="0.8 0.8" />
                                    <path d="M42 82L48 82" stroke="#111827" strokeWidth="0.5" />
                                    <path d="M45 80V84" stroke="#111827" strokeWidth="0.5" />

                                    {/* Rectangle with cross (right) */}
                                    <rect x="52" y="80" width="6" height="4" rx="1" stroke="#111827" strokeWidth="0.5" strokeDasharray="0.8 0.8" />
                                    <path d="M52 82L58 82" stroke="#111827" strokeWidth="0.5" />
                                    <path d="M55 80V84" stroke="#111827" strokeWidth="0.5" />

                                    {/* Door divider with studs */}
                                    <line x1="50" y1="60" x2="50" y2="90" stroke="#0d47a1" strokeWidth="0.8" strokeDasharray="0.5 2" />
                                    <circle cx="50" cy="65" r="1" fill="#111827" className="door-knocker" />
                                    <circle cx="50" cy="70" r="0.5" fill="#111827" />
                                    <circle cx="50" cy="75" r="0.5" fill="#111827" />
                                    <circle cx="50" cy="80" r="0.5" fill="#111827" />
                                    <circle cx="50" cy="85" r="0.5" fill="#111827" />

                                    {/* Door knockers/handles */}
                                    <circle cx="44" cy="65" r="2" fill="#111827" className="door-knocker" />
                                    <circle cx="56" cy="65" r="2" fill="#111827" className="door-knocker" />

                                    {/* Additional decorative elements to match the image */}
                                    <path d="M43 71C40 73 40 77 43 79" stroke="#111827" strokeWidth="0.5" strokeDasharray="0.8 0.8" strokeLinecap="round" />
                                    <path d="M57 71C60 73 60 77 57 79" stroke="#111827" strokeWidth="0.5" strokeDasharray="0.8 0.8" strokeLinecap="round" />
                                </svg>
                            </div>
                            <span className="ml-2 text-xl font-bold brand-text tracking-tight">ReelState</span>
                        </Link>
                    </div>

                    {/* Search Bar - Desktop */}
                    <div className="hidden lg:flex flex-1 justify-center px-8 max-w-lg">
                        <SearchBar />
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
                                    <div onClick={handleNotificationClick} className="cursor-pointer">
                                        <NotificationBadge onClick={handleNotificationClick} />
                                    </div>

                                    {/* Notification dropdown */}
                                    {notificationDropdownOpen && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-1 z-50 border border-gray-200 max-h-[500px] overflow-y-auto tunisia-shadow">
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
                                                    {notifications.slice(0, 5).map((notification) => {
                                                        const typeString = getNotificationTypeString(notification.type);
                                                        return (
                                                            <div
                                                                key={notification.id}
                                                                className={`px-4 py-3 hover:bg-gray-50 flex items-start cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                                                                onClick={() => handleNotificationView(notification.id)}
                                                            >
                                                                {/* Notification Icon based on type */}
                                                                <div className={`flex-shrink-0 rounded-full p-2 mr-3 ${typeString === 'like' ? 'bg-red-100 text-red-600' :
                                                                    typeString === 'comment' ? 'bg-blue-100 text-blue-600' :
                                                                        typeString === 'follow' ? 'bg-purple-100 text-purple-600' :
                                                                            typeString === 'property_approved' ? 'bg-green-100 text-green-600' :
                                                                                typeString === 'property_rejected' ? 'bg-yellow-100 text-yellow-600' :
                                                                                    'bg-gray-100 text-gray-600'
                                                                    }`}>
                                                                    {typeString === 'like' && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                    {typeString === 'comment' && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                    {typeString === 'follow' && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                                                                        </svg>
                                                                    )}
                                                                    {typeString === 'property_approved' && (
                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                        </svg>
                                                                    )}
                                                                    {typeString === 'property_rejected' && (
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
                                                        );
                                                    })}

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
                                                    className="h-8 w-8 rounded-full object-cover profile-avatar"
                                                />
                                            ) : (
                                                <div className="h-8 w-8 rounded-full flex items-center justify-center profile-avatar">
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
                                    className="px-4 py-1.5 text-blue-600 border border-blue-200 rounded-md hover:bg-blue-50 transition-colors text-sm"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    className="px-4 py-1.5 text-white rounded-md text-sm relative overflow-hidden"
                                    style={{
                                        background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                                        boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)'
                                    }}
                                >
                                    <span>Sign Up</span>
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Mobile menu button and search */}
                    <div className="flex items-center md:hidden">
                        {isAuthenticated && (
                            <div className="mr-2" onClick={() => navigate('/notifications')}>
                                <NotificationBadge onClick={() => navigate('/notifications')} />
                            </div>
                        )}

                        {/* Mobile search icon */}
                        <button
                            className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none mr-1"
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                        >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

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
            <div
                className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden transform transition-all duration-300 ease-in-out`}
                style={{
                    maxHeight: isMenuOpen ? '80vh' : '0',
                    opacity: isMenuOpen ? 1 : 0,
                    overflow: 'hidden'
                }}
            >
                {/* Mobile search bar with buttons */}
                <div className="px-4 pt-2 pb-3">
                    <SearchBar isMobile={true} />
                </div>

                <div className="pt-1 pb-3 space-y-1">
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
                    <div className="border-t border-gray-200 pt-4 pb-3 bg-gradient-to-b from-white to-gray-50">
                        <div className="flex items-center px-4">
                            {user?.profilePictureUrl ? (
                                <div className="flex-shrink-0">
                                    <img className="h-10 w-10 rounded-full object-cover profile-avatar" src={user.profilePictureUrl} alt="Profile" />
                                </div>
                            ) : (
                                <div className="flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full flex items-center justify-center profile-avatar">
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
                        <div className="mt-3 px-2">
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                className="flex items-center w-full px-3 py-2 text-left text-red-600 rounded-md hover:bg-red-50"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V7.414l-4-4H3zm9 5a1 1 0 00-1 1v6a1 1 0 102 0V9a1 1 0 00-1-1zm-2 1a1 1 0 10-2 0v6a1 1 0 102 0V9z" clipRule="evenodd" />
                                </svg>
                                Sign out
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="border-t border-gray-200 pt-4 pb-3 bg-gradient-to-b from-white to-gray-50">
                        <div className="flex flex-col space-y-3 px-4">
                            <Link
                                to="/login"
                                className="block text-center py-2 px-4 border border-blue-200 rounded-md text-blue-600 hover:bg-blue-50"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Log In
                            </Link>
                            <Link
                                to="/register"
                                className="block text-center py-2 px-4 rounded-md text-white"
                                style={{
                                    background: 'linear-gradient(to right, #3b82f6, #1e40af)',
                                    boxShadow: '0 4px 6px -1px rgba(59, 130, 246, 0.2), 0 2px 4px -1px rgba(59, 130, 246, 0.1)'
                                }}
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