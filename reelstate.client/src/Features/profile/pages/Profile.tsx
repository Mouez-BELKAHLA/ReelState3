import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from "../../../shared";
import { VideoCard } from '../../property';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toVideoCardProperties } from "../../../shared/Utils/TypeTransformers";
import { getErrorMessage } from "../../../shared";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { checkLikeStatus, toggleLike, updatePropertyLike } from "../../../store/slices/propertySlice";
import { refreshNotifications } from "../../../store/slices/notificationSlice";

// Import property types
import { Property, VideoCardProperty } from "../types/Property";

// Import ProfileService
import {
    getUserProfile,
    getUserProperties,
    getFollowStatus,
    toggleFollow,
    UserProfileData,
    FollowStatusData
} from '../services/ProfileService';

// Extend VideoCardProperty with optional views property
interface ExtendedVideoCardProperty extends VideoCardProperty {
    views?: number;
}

// Add interface for follow status
interface FollowStatusData {
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
}

const Profile: React.FC = () => {
    // Get auth state from Redux
    const dispatch = useAppDispatch();
    const { user, token, isAuthenticated } = useAppSelector(state => state.auth);
    const { propertyLikes, likeLoading } = useAppSelector(state => state.property);

    const [activeTab, setActiveTab] = useState<'videos' | 'liked'>('videos');
    const [properties, setProperties] = useState<ExtendedVideoCardProperty[]>([]);
    const [likedProperties, setLikedProperties] = useState<ExtendedVideoCardProperty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);

    // Add state for follow functionality
    const [followData, setFollowData] = useState<FollowStatusData>({
        isFollowing: false,
        followersCount: 0,
        followingCount: 0
    });
    const [isFollowLoading, setIsFollowLoading] = useState(false);

    const navigate = useNavigate();

    // Get userId from URL params, or use logged in user
    const { userId } = useParams<{ userId?: string }>();
    const isOwnProfile = !userId || (user && user.id === userId);

    // Determine which userId to use for API calls
    const targetUserId = userId || (user ? user.id : '');

    // Default avatar - data URI for a simple user icon
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDggNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    // Function to check like status for properties - using Redux - Fixed the missing function
    const checkAllLikeStatus = async (props: ExtendedVideoCardProperty[]) => {
        if (!isAuthenticated || !props.length) return;

        for (const property of props) {
            dispatch(checkLikeStatus(property.id));
        }
    };

    // Function to fetch follow status
    const fetchFollowStatus = useCallback(async () => {
        if (!isAuthenticated || !targetUserId || isOwnProfile || !token) return;

        try {
            // Use the service instead of direct axios call
            const response = await getFollowStatus(targetUserId, token);

            setFollowData({
                isFollowing: response.isFollowing,
                followersCount: response.followersCount,
                followingCount: response.followingCount
            });
        } catch (error) {
            console.error('Error fetching follow status:', error);
        }
    }, [isAuthenticated, targetUserId, isOwnProfile, token]);

    // Function to toggle follow status
    const handleToggleFollow = async () => {
        if (!isAuthenticated) {
            alert("Please log in to follow this user");
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        if (isOwnProfile || !token) {
            return;
        }

        try {
            setIsFollowLoading(true);
            console.log(`Attempting to toggle follow for user: ${targetUserId}`);

            // Use the service to toggle follow
            const response = await toggleFollow(targetUserId, token);
            console.log('Toggle follow response:', response);

            if (response && response.isSuccess) {
                setFollowData({
                    isFollowing: response.isFollowing,
                    followersCount: response.followersCount,
                    followingCount: response.followingCount
                });

                // Update profile data with new follower counts
                if (profileData) {
                    setProfileData({
                        ...profileData,
                        followersCount: response.followersCount,
                        followingCount: response.followingCount
                    });
                }

                // Refresh notifications to show new follow notification
                dispatch(refreshNotifications());

                console.log(`Successfully ${response.isFollowing ? 'followed' : 'unfollowed'} user ${targetUserId}`);
            } else {
                console.error('Toggle follow failed:', response);
                if (response?.message) {
                    alert(response.message);
                }
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert('Failed to follow/unfollow user. Please try again later.');
        } finally {
            setIsFollowLoading(false);
        }
    };

    // Handle like toggle using Redux
    const handleLikeToggle = async (propertyId: string) => {
        // Check if user is authenticated
        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        dispatch(toggleLike(propertyId));
    };

    // Handle like toggle from VideoCard components
    const handleVideoCardLikeToggle = (propertyId: string, isLiked: boolean, count: number) => {
        dispatch(updatePropertyLike({ propertyId, isLiked, count }));
    };

    // Navigate to feed with property ID
    const navigateToFeedWithProperty = (propertyId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Check that we found the property in our list
        const property = displayProperties.find(p => p.id === propertyId);
        if (!property) {
            console.error(`Property ${propertyId} not found in display properties`);
            return;
        }

        console.log(`Navigating to property: ${propertyId} for user: ${targetUserId}`);

        // For a cleaner approach, navigate directly to the Feed page with the property ID
        window.location.href = `/feed?property=${propertyId}`;
    };

    // Fetch follow status on component mount
    useEffect(() => {
        fetchFollowStatus();
    }, [fetchFollowStatus]);

    // Update profileData with follow counts when they change
    useEffect(() => {
        if (profileData && (followData.followersCount > 0 || followData.followingCount > 0)) {
            setProfileData({
                ...profileData,
                followersCount: followData.followersCount,
                followingCount: followData.followingCount
            });
        }
    }, [followData]);

    useEffect(() => {
        console.log("Profile loading for userId:", userId);
        console.log("Target userId:", targetUserId);
        // If we have no auth state and no userId, redirect to login
        if (!isAuthenticated && !userId) {
            navigate('/login', { state: { from: location.pathname } });
            return;
        }

        const fetchData = async () => {
            if (!targetUserId) {
                setError("No user information available.");
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);

                // Create profile data from auth state if it's the user's own profile
                if (isOwnProfile && user) {
                    setProfileData({
                        id: user.id,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        email: user.email,
                        profilePictureUrl: user.profilePictureUrl,
                        followersCount: 0,
                        followingCount: 0,
                        totalLikes: 0,
                        isVerified: false
                    });
                    console.log('Using auth user data for profile');
                }

                // Fetch ALL properties from the main endpoint
                try {
                    console.log('Fetching all properties');

                    const response = await axios.get<Property[]>(`${API_URL}/api/Property`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });

                    // Use the transformer to convert API data to UI components
                    const allProperties = toVideoCardProperties(response.data, API_URL) as ExtendedVideoCardProperty[];

                    // Filter properties to only show those from the target user
                    const userProperties = allProperties.filter(prop => {
                        // Check both userId and potential other identifying fields
                        if (prop.userId && prop.userId === targetUserId) {
                            return true;
                        }

                        // If profileData exists, also check for name match (backup)
                        if (profileData && prop.username) {
                            const fullName = `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim();
                            return prop.username === profileData.username ||
                                prop.username === fullName;
                        }

                        return false;
                    });

                    console.log(`Found ${userProperties.length} properties for user out of ${allProperties.length} total`);
                    setProperties(userProperties);

                    // Check like statuses for authenticated users
                    if (isAuthenticated && userProperties.length > 0) {
                        await checkAllLikeStatus(userProperties);
                    }

                    // For now, use the same properties for the liked tab
                    setLikedProperties(userProperties);
                } catch (err) {
                    console.error('Error fetching properties:', err);
                    setError(getErrorMessage(err, 'Failed to load properties'));
                }

                // Try to fetch user profile if not own profile
                if (!isOwnProfile) {
                    try {
                        const userResponse = await axios.get(
                            `${API_URL}/api/User/${targetUserId}`,
                            { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                        );

                        if (userResponse.data && userResponse.data.isSuccess) {
                            setProfileData(userResponse.data.data);
                        }
                    } catch (userErr) {
                        console.error('Error fetching user profile:', userErr);
                        // We'll still use profile data from auth state
                    }
                }

            } catch (err) {
                console.error('Error in profile data fetching:', err);
                setError(getErrorMessage(err, 'Could not load profile data'));
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isAuthenticated, user, targetUserId, isOwnProfile, navigate, token, userId]);
    // Important: Still need the eslint-disable comment since we're intentionally 
    // avoiding some dependencies to prevent loops

    // Function to render the appropriate properties based on the active tab
    const getDisplayProperties = () => {
        switch (activeTab) {
            case 'videos':
                return properties;
            case 'liked':
                return likedProperties;
            default:
                return properties;
        }
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-4">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                            Go Home
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!profileData && !isOwnProfile) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center max-w-md">
                    <svg className="w-16 h-16 text-yellow-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-2xl font-bold mb-4">Profile Not Found</h2>
                    <p className="text-gray-600 mb-6">We couldn't find a profile for this user.</p>
                    <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

    const displayProperties = getDisplayProperties();

    // Get display name, handling different data models
    const displayName = profileData ? (
        profileData.username ||
        `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() ||
        'User'
    ) : 'User';

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Profile Header Section */}
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex flex-col md:flex-row items-center">
                        {/* Avatar */}
                        <div className="relative mb-4 md:mb-0 md:mr-8">
                            <img
                                src={profileData?.profilePictureUrl || defaultAvatar}
                                alt={`${displayName}'s profile picture`}
                                className="w-24 h-24 md:w-32 md:h-32 rounded-full object-cover border-2 border-gray-200"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = defaultAvatar;
                                }}
                            />
                            {profileData?.isVerified && (
                                <div className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* Profile Info */}
                        <div className="text-center md:text-left flex-grow">
                            <h1 className="text-2xl md:text-3xl font-bold">{displayName}</h1>
                            {profileData?.email && <p className="text-gray-600">{profileData.email}</p>}

                            {profileData?.bio && (
                                <p className="mt-2 text-gray-700">{profileData.bio}</p>
                            )}

                            {/* Stats */}
                            <div className="flex justify-center md:justify-start mt-4 space-x-6">
                                <div className="text-center">
                                    <p className="font-bold">{profileData?.followingCount || followData.followingCount || 0}</p>
                                    <p className="text-gray-600 text-sm">Following</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold">{profileData?.followersCount || followData.followersCount || 0}</p>
                                    <p className="text-gray-600 text-sm">Followers</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold">{properties.length || 0}</p>
                                    <p className="text-gray-600 text-sm">Properties</p>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="mt-4 md:mt-0 flex space-x-3">
                            {isOwnProfile ? (
                                <>
                                    <Link to="/create" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md">
                                        Create Listing
                                    </Link>
                                    <button
                                        onClick={() => navigate('/settings')}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md"
                                    >
                                        Edit Profile
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        className={`flex items-center ${followData.isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-blue-600 text-white'} px-6 py-2 rounded-md hover:opacity-90 transition-colors`}
                                        onClick={handleToggleFollow}
                                        disabled={isFollowLoading}
                                    >
                                        {isFollowLoading ? (
                                            <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></span>
                                        ) : followData.isFollowing ? (
                                            <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                            </svg>
                                        )}
                                        {followData.isFollowing ? 'Following' : 'Follow'}
                                    </button>
                                    <button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md">
                                        Message
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex justify-center md:justify-start">
                        <button
                            className={`px-6 py-3 font-medium ${activeTab === 'videos' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('videos')}
                        >
                            Properties
                        </button>
                        {isOwnProfile && (
                            <button
                                className={`px-6 py-3 font-medium ${activeTab === 'liked' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                                onClick={() => setActiveTab('liked')}
                            >
                                Liked
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="container mx-auto px-4 py-6">
                {displayProperties.length === 0 ? (
                    <div className="text-center py-20">
                        {activeTab === 'videos' && (
                            <>
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <h3 className="text-xl font-semibold">No property listings yet</h3>
                                {isOwnProfile && (
                                    <>
                                        <p className="text-gray-500 mt-2 mb-4">Share your first property listing</p>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                            <Link to="/create" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                                                Create New Listing
                                            </Link>
                                        </div>
                                    </>
                                )}
                            </>
                        )}

                        {activeTab === 'liked' && (
                            <>
                                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                                <h3 className="text-xl font-semibold">No liked properties</h3>
                                <p className="text-gray-500 mt-2">Properties you like will appear here</p>
                                <Link to="/feed" className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
                                    Discover Properties
                                </Link>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {displayProperties.map(property => {
                            // Get the current like state for this property from Redux store
                            const propertyLikeState = propertyLikes[property.id] || {
                                count: property.likes || 0,
                                isLiked: false
                            };
                            const isLikeLoadingState = likeLoading[property.id] || false;

                            return (
                                <div
                                    key={property.id}
                                    className="relative aspect-[9/16] h-[350px] md:h-[400px] bg-black rounded-lg overflow-hidden cursor-pointer"
                                    onClick={(e) => navigateToFeedWithProperty(property.id, e)}
                                >
                                    {/* Use div with onClick instead of Link component */}
                                    <div className="h-full w-full">
                                        <VideoCard
                                            id={property.id}
                                            userId={property.userId}
                                            username={property.username || displayName}
                                            caption={property.caption}
                                            videoUrl={property.videoUrl}
                                            likes={propertyLikeState.count}
                                            comments={property.comments}
                                            avatarUrl={property.avatarUrl || profileData?.profilePictureUrl || defaultAvatar}
                                            rooms={property.rooms}
                                            propertyType={property.propertyType}
                                            space={property.space}
                                            photos={property.photos}
                                            location={property.location}
                                            title={property.title}
                                            externalButtons={true}
                                            onLikeToggle={(isLiked, count) => handleVideoCardLikeToggle(property.id, isLiked, count)}
                                        />
                                    </div>

                                    {/* Video stats overlay */}
                                    <div className="absolute bottom-2 left-2 z-20 flex items-center text-white text-sm">
                                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        {property.views || 0}
                                    </div>

                                    {/* View in Feed button */}
                                    <div className="absolute top-3 right-3 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigateToFeedWithProperty(property.id, e);
                                            }}
                                            className="flex items-center bg-blue-600/80 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-full backdrop-blur-sm"
                                        >
                                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                            View in Feed
                                        </button>
                                    </div>

                                    {/* Manual like button */}
                                    <div className="absolute right-3 bottom-20 z-20">
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleLikeToggle(property.id);
                                            }}
                                            className={`flex flex-col items-center ${propertyLikeState.isLiked ? 'text-red-500' : 'text-white'} transition-colors`}
                                            disabled={isLikeLoadingState}
                                        >
                                            <div className="backdrop-blur-lg bg-black/30 rounded-full p-3 hover:bg-white/20 transition-all border border-white/20">
                                                {isLikeLoadingState ? (
                                                    <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"></div>
                                                ) : (
                                                    <svg className="w-6 h-6" fill={propertyLikeState.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="text-sm mt-1 font-medium">{propertyLikeState.count}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;