import { useEffect, useRef, useState } from "react";
import axios from 'axios';
import { API_URL } from "../Services/config";
import { useAuth } from "../Hooks/useAuth";
import VideoCard from "../Components/VideoCard";
import { Property } from "../Models/Property";

// Interface for mapped property format needed by VideoCard
interface VideoCardProperty {
    id: string;
    username: string;
    caption: string;
    videoUrl: string;
    likes: number;
    comments: number;
    avatarUrl: string;
    rooms?: number;
    propertyType?: string;
    space?: number;
    photos?: string[];
    location?: {
        address: string;
        city: string;
        coordinates?: {
            lat: number;
            lng: number;
        };
    };
}

export default function Feed() {
    const { authState } = useAuth();
    const { token } = authState;

    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [properties, setProperties] = useState<VideoCardProperty[]>([]);

    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize videoRefs with the correct length
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, properties.length);
    }, [properties]);

    // Fetch properties from the API
    useEffect(() => {
        const fetchProperties = async () => {
            if (!token) return;

            try {
                setIsLoading(true);
                const response = await axios.get<Property[]>(`${API_URL}/api/Property`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                console.log("API response:", response.data);

                // Map API response to the format VideoCard expects
                const mappedProperties: VideoCardProperty[] = response.data.map(property => ({
                    id: property.id,
                    username: property.user?.firstName || 'Unknown User',
                    caption: property.caption,
                    videoUrl: `${API_URL}${property.videoUrl}`,
                    // Use likesCount property if it exists, otherwise default to 0
                    likes: property.likesCount || 0,
                    comments: property.commentsCount || 0,
                    avatarUrl: property.user?.profilePictureUrl || 'https://randomuser.me/api/portraits/lego/1.jpg',
                    rooms: property.rooms,
                    propertyType: property.propertyType,
                    space: property.space,
                    photos: property.photos?.map(p => `${API_URL}${p.photoUrl}`) || [],
                    location: {
                        address: property.address,
                        city: property.city,
                        coordinates: {
                            lat: property.latitude,
                            lng: property.longitude
                        }
                    }
                }));

                console.log("Mapped properties:", mappedProperties);
                setProperties(mappedProperties);
            } catch (err: any) {
                console.error('Error fetching properties:', err);
                setError(err.message || 'Failed to load properties');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProperties();
    }, [token]);

    // Set up intersection observer to detect which video is in view
    useEffect(() => {
        if (properties.length === 0) return;

        const options = {
            root: null, // use the viewport
            rootMargin: "0px",
            threshold: 0.6, // 60% visibility triggers the callback
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const index = videoRefs.current.findIndex((ref) => ref === entry.target);
                    if (index !== -1) {
                        setActiveVideoIndex(index);
                    }
                }
            });
        }, options);

        // Observe all video elements
        videoRefs.current.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            videoRefs.current.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [properties]);

    // Loading state
    if (isLoading) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading properties...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-gray-100 min-h-screen flex items-center justify-center">
                <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                    <svg className="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-2">Error Loading Properties</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (properties.length === 0) {
        return (
            <div className="bg-gray-100 min-h-screen">
                {/* Header - Sticky at the top */}
                <div className="sticky top-0 left-0 right-0 bg-white z-50 shadow-sm">
                    <div className="container mx-auto px-4 py-3">
                        <h2 className="text-xl font-bold">Découvrir</h2>
                    </div>
                </div>

                <div className="flex items-center justify-center h-[80vh]">
                    <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
                        <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <h2 className="text-2xl font-semibold text-gray-800 mb-2">No Properties Found</h2>
                        <p className="text-gray-600 mb-4">Be the first to create a property listing!</p>
                        <a
                            href="/create"
                            className="inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                        >
                            Create Listing
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    // Normal state with properties
    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header - Sticky at the top */}
            <div className="sticky top-0 left-0 right-0 bg-white z-50 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <h2 className="text-xl font-bold">Découvrir</h2>
                    <a
                        href="/create"
                        className="px-4 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
                    >
                        + Add Listing
                    </a>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
                <div className="container mx-auto py-6 px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map((property) => (
                            <div key={property.id} className="h-[600px]">
                                <VideoCard {...property} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Layout - TikTok Style */}
            <div
                ref={containerRef}
                className="md:hidden snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-gray-100"
                style={{ height: 'calc(100vh - 55px)' }}
            >
                {properties.map((property, index) => (
                    <div
                        key={property.id}
                        ref={(el) => { videoRefs.current[index] = el }}
                        className="snap-start snap-always w-screen py-1.5" // Small padding at top and bottom
                        style={{ height: 'calc(100vh - 105px)' }} // Show a bit of the next video
                    >
                        <div className="h-full w-full rounded-lg overflow-hidden">
                            <VideoCard {...property} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}