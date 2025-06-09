import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { API_URL } from "../../../shared";
import { Link, useParams, useNavigate } from 'react-router-dom';
import { toVideoCardProperties } from "../../../shared/Utils/TypeTransformers";
import { getErrorMessage } from "../../../shared";
import { useAppSelector, useAppDispatch } from "../../../store/hooks";
import { checkLikeStatus, toggleLike, updatePropertyLike } from "../../../store/slices/propertySlice";
import { refreshNotifications } from "../../../store/slices/notificationSlice";
import { fetchUserActivity } from "../../../store/slices/userActivitySlice";

// Import property types
import { Property, VideoCardProperty } from "../../property";

// Define interfaces
interface UserProfileData {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    username?: string;
    bio?: string;
    profilePictureUrl?: string;
    followersCount: number;
    followingCount: number;
    totalLikes: number;
    isVerified: boolean;
}

interface FollowStatusData {
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
}

// Extend VideoCardProperty with views property
interface ExtendedVideoCardProperty extends VideoCardProperty {
    views: number;
}

// ProfileService functions (inline)
const getUserProfile = async (userId: string, token: string): Promise<UserProfileData> => {
    const response = await axios.get(`${API_URL}/api/User/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data.data;
};

const getFollowStatus = async (userId: string, token: string): Promise<FollowStatusData> => {
    const response = await axios.get(`${API_URL}/api/User/${userId}/follow-status`, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

const toggleFollow = async (userId: string, token: string): Promise<FollowStatusData & { isSuccess: boolean }> => {
    const response = await axios.post(`${API_URL}/api/User/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

// Enhanced Video Player Component with proper play tracking
const SimpleVideoPlayer: React.FC<{
    videoUrl: string;
    isPlaying: boolean;
    onVideoClick: () => void;
    onVideoPlay?: (propertyId: string) => void;
    propertyId: string;
}> = ({ videoUrl, isPlaying, onVideoClick, onVideoPlay, propertyId }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

    useEffect(() => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.play().catch(console.error);
            } else {
                videoRef.current.pause();
                videoRef.current.currentTime = 0;
            }
        }
    }, [isPlaying]);

    const handlePlay = useCallback(() => {
        // Only increment view on the first play event for this video instance
        if (!hasPlayedOnce && onVideoPlay) {
            setHasPlayedOnce(true);
            onVideoPlay(propertyId);
        }
    }, [hasPlayedOnce, onVideoPlay, propertyId]);

    return (
        <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-cover cursor-pointer"
            muted
            loop
            playsInline
            onClick={onVideoClick}
            onPlay={handlePlay}
        />
    );
};

// Followers/Following list component
const UserListComponent: React.FC<{
    users: Array<{
        id: string;
        followerUserId?: string;
        followedUserId?: string;
        followerUsername?: string;
        followedUsername?: string;
        followerProfilePicture?: string;
        followedProfilePicture?: string;
        createdAt: string;
    }>;
    type: 'followers' | 'following';
}> = ({ users, type }) => {
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDgtNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    if (users.length === 0) {
        return (
            <div className="text-center py-20">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
                <h3 className="text-xl font-semibold">
                    No {type === 'followers' ? 'followers' : 'following'} yet
                </h3>
                <p className="text-gray-500 mt-2">
                    {type === 'followers'
                        ? 'When people follow this user, they\'ll appear here'
                        : 'This user isn\'t following anyone yet'
                    }
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {users.map(user => {
                const userId = type === 'followers' ? user.followerUserId : user.followedUserId;
                const username = type === 'followers' ? user.followerUsername : user.followedUsername;
                const profilePicture = type === 'followers' ? user.followerProfilePicture : user.followedProfilePicture;

                return (
                    <div key={user.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center text-center">
                            <img
                                src={profilePicture || defaultAvatar}
                                alt={username || 'User'}
                                className="w-16 h-16 rounded-full object-cover mb-3"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = defaultAvatar;
                                }}
                            />
                            <h3 className="font-medium text-gray-900 truncate w-full">
                                {username || 'Unknown User'}
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">
                                {type === 'followers' ? 'Follower' : 'Following'} since {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                            <Link
                                to={`/profile/${userId}`}
                                className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white text-sm py-2 px-4 rounded-md transition-colors"
                            >
                                View Profile
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const Profile: React.FC = () => {
    // Get auth state from Redux
    const dispatch = useAppDispatch();
    const { user, token, isAuthenticated } = useAppSelector(state => state.auth);
    const { propertyLikes, likeLoading } = useAppSelector(state => state.property);
    const { following, followers, loading: userActivityLoading } = useAppSelector(state => state.userActivity);

    const [activeTab, setActiveTab] = useState<'videos' | 'liked' | 'followers' | 'following'>('videos');
    const [properties, setProperties] = useState<ExtendedVideoCardProperty[]>([]);
    const [likedProperties, setLikedProperties] = useState<ExtendedVideoCardProperty[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [profileData, setProfileData] = useState<UserProfileData | null>(null);
    const [hoveredVideoId, setHoveredVideoId] = useState<string | null>(null);

    // Session-based view tracking
    const [sessionViewedVideos, setSessionViewedVideos] = useState<Set<string>>(new Set());
    const [viewLoading, setViewLoading] = useState<{ [key: string]: boolean }>({});

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
    const defaultAvatar = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iI2NjYyI+PHBhdGggZD0iTTEyIDJDNi40OCAyIDIgNi40OCAyIDEyczQuNDggMTAgMTAgMTAgMTAtNC40OCAxMC0xMFMxNy41MiAyIDEyIDJ6bTAgM2MyLjY3IDAgOC0xLjM0IDgtNHYyYzAgMi42Ny01LjMzIDQtOCA0cy04LTEuMzMtOC00VjljMC0yLjY2IDUuMzMtNCA4LTR6bTAgMTAuOThjNy42NCAwIDkuMzktMy4zOCA5LjQtMy45OFYxNWMwIC42Ny0zLjEzIDQtOS40IDQtNi4yOCAwLTkuNC0zLjMzLTkuNC00di0yLjk4YzAtLjA3IDEuNzYgMy45OCA5LjQgMy45OHoiLz48L3N2Zz4=";

    // Function to increment view count - only called when video actually plays
    const incrementViewCount = useCallback(async (propertyId: string) => {
        // Check if already viewed in this session or currently loading
        if (sessionViewedVideos.has(propertyId) || viewLoading[propertyId]) {
            console.log(`View already counted for property ${propertyId} in this session`);
            return;
        }

        try {
            setViewLoading(prev => ({ ...prev, [propertyId]: true }));
            console.log(`Incrementing view for property: ${propertyId} (first play)`);

            const response = await axios.post(`${API_URL}/api/Property/${propertyId}/view`);

            console.log(`View increment response:`, response.data);

            if (response.data.success) {
                // Mark as viewed in this session
                setSessionViewedVideos(prev => new Set([...prev, propertyId]));

                // Update local state to reflect the view increment
                setProperties(prev => prev.map(prop =>
                    prop.id === propertyId
                        ? { ...prop, views: response.data.views }
                        : prop
                ));

                console.log(`View count updated for property ${propertyId}: ${response.data.views}`);
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
        } finally {
            setViewLoading(prev => ({ ...prev, [propertyId]: false }));
        }
    }, [sessionViewedVideos, viewLoading]);

    // Function to check like status for properties - using Redux
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

            const response = await toggleFollow(targetUserId, token);

            if (response && response.isSuccess) {
                setFollowData({
                    isFollowing: response.isFollowing,
                    followersCount: response.followersCount,
                    followingCount: response.followingCount
                });

                if (profileData) {
                    setProfileData({
                        ...profileData,
                        followersCount: response.followersCount,
                        followingCount: response.followingCount
                    });
                }

                // Refresh user activity data to get updated followers/following
                dispatch(fetchUserActivity(targetUserId));
                dispatch(refreshNotifications());
            }
        } catch (error) {
            console.error('Error toggling follow:', error);
            alert('Failed to follow/unfollow user. Please try again later.');
        } finally {
            setIsFollowLoading(false);
        }
    };

    // Handle like toggle using Redux
    const handleLikeToggle = async (propertyId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isAuthenticated) {
            alert("Please log in to like this property");
            return;
        }

        dispatch(toggleLike(propertyId));
    };

    // Navigate to user feed - no view increment here
    const navigateToFeedWithProperty = useCallback((propertyId: string) => {
        console.log(`Opening user video feed for property: ${propertyId}`);

        // Navigate to user-specific video feed
        const params = new URLSearchParams();
        params.set('property', propertyId);
        params.set('t', Date.now().toString());

        const url = `/user-videos/${targetUserId}?${params.toString()}`;
        navigate(url);
    }, [navigate, targetUserId]);

    // Handle followers count click
    const handleFollowersClick = () => {
        setActiveTab('followers');
    };

    // Handle following count click
    const handleFollowingClick = () => {
        setActiveTab('following');
    };

    // Fetch follow status on component mount
    useEffect(() => {
        fetchFollowStatus();
    }, [fetchFollowStatus]);

    // Fetch user activity data when targetUserId changes
    useEffect(() => {
        if (targetUserId) {
            dispatch(fetchUserActivity(targetUserId));
        }
    }, [dispatch, targetUserId]);

    // Update profileData with follow counts when they change
    useEffect(() => {
        if (profileData && (followData.followersCount > 0 || followData.followingCount > 0)) {
            setProfileData({
                ...profileData,
                followersCount: followData.followersCount,
                followingCount: followData.followingCount
            });
        }
    }, [followData, profileData]);

    // Periodic refresh of view counts (optional - for real-time updates)
    useEffect(() => {
        const interval = setInterval(() => {
            if (properties.length > 0) {
                const fetchUpdatedData = async () => {
                    try {
                        const response = await axios.get(`${API_URL}/api/Property`, {
                            headers: token ? { Authorization: `Bearer ${token}` } : {}
                        });

                        if (response.data && Array.isArray(response.data)) {
                            const transformedProperties = response.data.map((property: any) => ({
                                id: property.id,
                                userId: property.userId,
                                username: property.user ?
                                    `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim() ||
                                    property.user.email :
                                    'Unknown User',
                                caption: property.caption,
                                title: property.title,
                                videoUrl: property.videoUrl.startsWith('http') ?
                                    property.videoUrl :
                                    `${API_URL}${property.videoUrl}`,
                                likes: property.likesCount || 0,
                                comments: property.commentsCount || 0,
                                views: property.views || 0,
                                avatarUrl: property.user?.profilePictureUrl || defaultAvatar,
                                rooms: property.rooms,
                                propertyType: property.propertyType,
                                space: property.space,
                                photos: property.photos?.map((photo: any) => ({
                                    id: photo.id,
                                    photoUrl: photo.photoUrl.startsWith('http') ?
                                        photo.photoUrl :
                                        `${API_URL}${photo.photoUrl}`
                                })) || [],
                                location: {
                                    address: property.address,
                                    city: property.city,
                                    coordinates: {
                                        lat: property.latitude,
                                        lng: property.longitude
                                    }
                                },
                                status: property.status
                            }));

                            const userProperties = transformedProperties.filter((prop: any) =>
                                prop.userId === targetUserId
                            );

                            // Only update view counts without overriding session tracking
                            setProperties(prev => prev.map(prevProp => {
                                const updatedProp = userProperties.find((newProp: any) => newProp.id === prevProp.id);
                                return updatedProp ? { ...prevProp, views: updatedProp.views } : prevProp;
                            }));
                        }
                    } catch (error) {
                        console.error('Error refreshing view counts:', error);
                    }
                };

                fetchUpdatedData();
            }
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [properties.length, targetUserId, token, defaultAvatar]);

    useEffect(() => {
        console.log("Profile loading for userId:", userId);
        console.log("Target userId:", targetUserId);

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
                }

                // Fetch ALL properties from the main endpoint
                try {
                    console.log('Fetching all properties...');

                    const response = await axios.get(`${API_URL}/api/Property`, {
                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                    });

                    console.log('Raw API response:', response.data);

                    if (!response.data || !Array.isArray(response.data)) {
                        console.error('Invalid API response structure:', response.data);
                        setError('Invalid response from server');
                        return;
                    }

                    // Transform the data to include views and other necessary fields
                    const transformedProperties = response.data.map((property: any) => {
                        const transformed = {
                            id: property.id,
                            userId: property.userId,
                            username: property.user ?
                                `${property.user.firstName || ''} ${property.user.lastName || ''}`.trim() ||
                                property.user.email :
                                'Unknown User',
                            caption: property.caption,
                            title: property.title,
                            videoUrl: property.videoUrl.startsWith('http') ?
                                property.videoUrl :
                                `${API_URL}${property.videoUrl}`,
                            likes: property.likesCount || 0,
                            comments: property.commentsCount || 0,
                            views: property.views || 0,
                            avatarUrl: property.user?.profilePictureUrl || defaultAvatar,
                            rooms: property.rooms,
                            propertyType: property.propertyType,
                            space: property.space,
                            photos: property.photos?.map((photo: any) => ({
                                id: photo.id,
                                photoUrl: photo.photoUrl.startsWith('http') ?
                                    photo.photoUrl :
                                    `${API_URL}${photo.photoUrl}`
                            })) || [],
                            location: {
                                address: property.address,
                                city: property.city,
                                coordinates: {
                                    lat: property.latitude,
                                    lng: property.longitude
                                }
                            },
                            status: property.status
                        };
                        return transformed;
                    });

                    console.log('Transformed properties:', transformedProperties);

                    // Filter properties to only show those from the target user
                    const userProperties = transformedProperties.filter((prop: any) => {
                        return prop.userId === targetUserId;
                    });

                    console.log(`Found ${userProperties.length} properties for user out of ${transformedProperties.length} total`);
                    setProperties(userProperties as ExtendedVideoCardProperty[]);

                    // Check like statuses for authenticated users
                    if (isAuthenticated && userProperties.length > 0) {
                        await checkAllLikeStatus(userProperties as ExtendedVideoCardProperty[]);
                    }

                    // For now, use the same properties for the liked tab
                    setLikedProperties(userProperties as ExtendedVideoCardProperty[]);
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
    }, [isAuthenticated, user, targetUserId, isOwnProfile, navigate, token, userId]);

    // Function to render the appropriate content based on the active tab
    const renderTabContent = () => {
        switch (activeTab) {
            case 'videos':
                return renderPropertiesGrid(properties);
            case 'liked':
                return renderPropertiesGrid(likedProperties);
            case 'followers':
                return (
                    <UserListComponent
                        users={followers?.recent || []}
                        type="followers"
                    />
                );
            case 'following':
                return (
                    <UserListComponent
                        users={following?.recent || []}
                        type="following"
                    />
                );
            default:
                return renderPropertiesGrid(properties);
        }
    };

    // Function to render properties grid
    const renderPropertiesGrid = (displayProperties: ExtendedVideoCardProperty[]) => {
        if (displayProperties.length === 0) {
            return (
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
            );
        }

        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
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
                            className="relative aspect-[9/16] h-[350px] md:h-[400px] bg-black rounded-lg overflow-hidden cursor-pointer group"
                            onMouseEnter={() => setHoveredVideoId(property.id)}
                            onMouseLeave={() => setHoveredVideoId(null)}
                        >
                            {/* Video Player */}
                            <SimpleVideoPlayer
                                videoUrl={property.videoUrl}
                                isPlaying={hoveredVideoId === property.id}
                                onVideoClick={() => navigateToFeedWithProperty(property.id)}
                                onVideoPlay={incrementViewCount}
                                propertyId={property.id}
                            />

                            {/* Gradient overlay for better text visibility */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                            {/* Title - top left */}
                            <div className="absolute top-3 left-3 z-20">
                                <h3 className="text-white text-sm font-semibold truncate max-w-[200px] bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                                    {property.title}
                                </h3>
                            </div>

                            {/* View count - bottom left */}
                            <div className="absolute bottom-3 left-3 z-20 flex items-center text-white text-sm">
                                <div className="bg-black/30 px-2 py-1 rounded backdrop-blur-sm flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                    <span className="font-medium">
                                        {property.views >= 1000 ?
                                            `${(property.views / 1000).toFixed(1)}K` :
                                            property.views.toString()}
                                    </span>
                                </div>
                            </div>

                            {/* Like button - bottom right */}
                            <div className="absolute right-3 bottom-3 z-20">
                                <button
                                    onClick={(e) => handleLikeToggle(property.id, e)}
                                    className={`flex flex-col items-center ${propertyLikeState.isLiked ? 'text-red-500' : 'text-white'} transition-all duration-200 transform hover:scale-110`}
                                    disabled={isLikeLoadingState}
                                >
                                    <div className="backdrop-blur-sm bg-black/30 rounded-full p-2.5 hover:bg-black/50 transition-all border border-white/20">
                                        {isLikeLoadingState ? (
                                            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin border-current"></div>
                                        ) : (
                                            <svg className="w-5 h-5" fill={propertyLikeState.isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="text-xs mt-1 font-medium bg-black/30 px-1.5 py-0.5 rounded backdrop-blur-sm">
                                        {propertyLikeState.count >= 1000 ?
                                            `${(propertyLikeState.count / 1000).toFixed(1)}K` :
                                            propertyLikeState.count}
                                    </span>
                                </button>
                            </div>

                            {/* Play button overlay - shows when not hovering */}
                            {hoveredVideoId !== property.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <button
                                        onClick={() => navigateToFeedWithProperty(property.id)}
                                        className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm hover:bg-white/30 transition-all"
                                    >
                                        <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M8 5v14l11-7z" />
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
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
                    <p className="text-gray-600 mb-6">We could not find a profile for this user.</p>
                    <Link to="/" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                        Go Home
                    </Link>
                </div>
            </div>
        );
    }

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
                                alt={`${displayName} profile picture`}
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

                            {/* Stats - Fixed alignment */}
                            <div className="flex justify-center md:justify-start mt-4 space-x-8">
                                <button
                                    onClick={handleFollowingClick}
                                    className="text-center hover:bg-gray-100 rounded-lg p-3 transition-colors min-w-[80px]"
                                >
                                    <p className="font-bold text-lg">{profileData?.followingCount || followData.followingCount || following?.total || 0}</p>
                                    <p className="text-gray-600 text-sm">Following</p>
                                </button>
                                <button
                                    onClick={handleFollowersClick}
                                    className="text-center hover:bg-gray-100 rounded-lg p-3 transition-colors min-w-[80px]"
                                >
                                    <p className="font-bold text-lg">{profileData?.followersCount || followData.followersCount || followers?.total || 0}</p>
                                    <p className="text-gray-600 text-sm">Followers</p>
                                </button>
                                <div className="text-center min-w-[80px] p-3">
                                    <p className="font-bold text-lg">{properties.length || 0}</p>
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
                        <button
                            className={`px-6 py-3 font-medium ${activeTab === 'followers' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('followers')}
                        >
                            Followers
                            <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100">
                                {followers?.total || 0}
                            </span>
                        </button>
                        <button
                            className={`px-6 py-3 font-medium ${activeTab === 'following' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('following')}
                        >
                            Following
                            <span className="ml-2 py-0.5 px-2.5 text-xs font-medium rounded-full bg-gray-100">
                                {following?.total || 0}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 py-6">
                {userActivityLoading && (activeTab === 'followers' || activeTab === 'following') ? (
                    <div className="text-center py-10">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-500">Loading {activeTab}...</p>
                    </div>
                ) : (
                    renderTabContent()
                )}
            </div>
        </div>
    );
};

export default Profile;