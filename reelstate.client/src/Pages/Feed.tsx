import { useEffect, useRef, useState } from "react";
import VideoCard from "../Components/VideoCard";

// Mock data for real estate listings
const videos = [
    {
        id: '1',
        username: 'user123',
        caption: 'Magnifique appartement lumineux au cœur de la ville',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-portrait-of-a-fashion-woman-with-silver-makeup-39875-large.mp4',
        likes: 1024,
        comments: 89,
        avatarUrl: 'https://randomuser.me/api/portraits/women/32.jpg',
        rooms: 3,
        propertyType: "appartement",
        space: 85,
        photos: [
            "https://images.unsplash.com/photo-1484154218962-a197022b5858?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
            "https://images.unsplash.com/photo-1501183638710-841dd1904471?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
            "https://images.unsplash.com/photo-1493809842364-78817add7ffb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
        ],
        location: {
            address: "45 Rue de Rivoli",
            city: "Paris, France",
            coordinates: {
                lat: 48.8566,
                lng: 2.3522
            }
        }
    },
    {
        id: '2',
        username: 'travelguy',
        caption: 'Villa moderne avec jardin et terrasse panoramique',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-her-smartphone-in-the-street-44079-large.mp4',
        likes: 832,
        comments: 53,
        avatarUrl: 'https://randomuser.me/api/portraits/men/22.jpg',
        rooms: 5,
        propertyType: "villa",
        space: 150,
        photos: [
            "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
            "https://images.unsplash.com/photo-1600585154526-990dced4db0d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80",
            "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
        ],
        location: {
            address: "28 Avenue de la Californie",
            city: "Nice, France",
            coordinates: {
                lat: 43.7102,
                lng: 7.2620
            }
        }
    },
    {
        id: '3',
        username: 'foodie44',
        caption: 'Studio cozy idéal pour un premier investissement',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-man-dancing-under-changing-lights-32993-large.mp4',
        likes: 2048,
        comments: 132,
        avatarUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        rooms: 1,
        propertyType: "studio",
        space: 35,
        photos: [
            "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80",
            "https://images.unsplash.com/photo-1502005229762-cf1b2da7c5d6?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1287&q=80",
            "https://images.unsplash.com/photo-1560448204-61dc36dc98c8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1770&q=80"
        ],
        location: {
            address: "12 Rue des Lombards",
            city: "Lyon, France",
            coordinates: {
                lat: 45.7640,
                lng: 4.8357
            }
        }
    },
];

export default function Feed() {
    const [activeVideoIndex, setActiveVideoIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Initialize videoRefs with the correct length
    useEffect(() => {
        videoRefs.current = videoRefs.current.slice(0, videos.length);
    }, []);

    // Set up intersection observer to detect which video is in view
    useEffect(() => {
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
    }, []);

    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Header - Sticky at the top */}
            <div className="sticky top-0 left-0 right-0 bg-white z-50 shadow-sm">
                <div className="container mx-auto px-4 py-3">
                    <h2 className="text-xl font-bold">Découvrir</h2>
                </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden md:block">
                <div className="container mx-auto py-6 px-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                        {videos.map((video) => (
                            <div key={video.id} className="h-[600px]">
                                <VideoCard {...video} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Mobile Layout - TikTok Style with small separation between videos */}
            <div
                ref={containerRef}
                className="md:hidden snap-y snap-mandatory overflow-y-auto overscroll-y-contain bg-gray-100"
                style={{ height: 'calc(100vh - 55px)' }}
            >
                {videos.map((video, index) => (
                    <div
                        key={video.id}
                        ref={(el) => { videoRefs.current[index] = el }}
                        className="snap-start snap-always w-screen py-1.5" // Small padding at top and bottom
                        style={{ height: 'calc(100vh - 105px)' }} // Show a bit of the next video
                    >
                        <div className="h-full w-full rounded-lg overflow-hidden">
                            <VideoCard {...video} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}