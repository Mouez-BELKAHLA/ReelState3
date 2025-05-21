import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../../../store/hooks';
import { fetchPendingVideos, approveVideo, rejectVideo } from '../../../store/slices/adminSlice';
import { VideoCard } from '../../property';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const { user, isAuthenticated } = useAppSelector(state => state.auth);
    const { pendingVideos, loading, error } = useAppSelector(state => state.admin);

    const [activeVideoIndex, setActiveVideoIndex] = useState<number>(0);
    const [rejectionReason, setRejectionReason] = useState<string>('');
    const [showRejectModal, setShowRejectModal] = useState<boolean>(false);

    // Check if user is admin
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        } else if (user && (!user.roles || !user.roles.includes('Admin'))) {
            navigate('/unauthorized');
        }
    }, [isAuthenticated, user, navigate]);

    // Load pending videos
    useEffect(() => {
        if (isAuthenticated && user?.roles?.includes('Admin')) {
            dispatch(fetchPendingVideos());
        }
    }, [dispatch, isAuthenticated, user]);

    const handleApprove = (videoId: string) => {
        dispatch(approveVideo(videoId))
            .unwrap()
            .then(() => {
                // Show success notification
                alert('Video approved successfully!');
            })
            .catch(error => {
                console.error('Failed to approve video:', error);
                alert(`Failed to approve video: ${error.message}`);
            });
    };

    const handleReject = (videoId: string) => {
        dispatch(rejectVideo({ videoId, reason: rejectionReason }))
            .unwrap()
            .then(() => {
                setShowRejectModal(false);
                setRejectionReason('');
                // Show success notification
                alert('Video rejected successfully');
            })
            .catch(error => {
                console.error('Failed to reject video:', error);
                alert(`Failed to reject video: ${error.message}`);
            });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex justify-center items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-700"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                <header className="bg-white shadow-sm rounded-lg p-6 mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-600">Review and approve property videos before they go public</p>
                </header>

                {error && (
                    <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
                        {error}
                    </div>
                )}

                <div className="bg-white shadow-sm rounded-lg p-6 mb-6">
                    <h2 className="text-xl font-semibold mb-4">Pending Approvals ({pendingVideos.length})</h2>

                    {pendingVideos.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <p className="mt-2 text-lg">No videos pending approval</p>
                            <p className="text-sm">All submissions have been reviewed</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-6">
                            {/* Active video for review */}
                            <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex flex-col md:flex-row gap-6">
                                    {/* Video preview */}
                                    <div className="w-full md:w-1/2 h-[600px] bg-black rounded-lg overflow-hidden">
                                        <VideoCard
                                            id={pendingVideos[activeVideoIndex].id}
                                            userId={pendingVideos[activeVideoIndex].userId}
                                            username={pendingVideos[activeVideoIndex].username}
                                            caption={pendingVideos[activeVideoIndex].caption}
                                            videoUrl={pendingVideos[activeVideoIndex].videoUrl}
                                            likes={pendingVideos[activeVideoIndex].likes}
                                            comments={pendingVideos[activeVideoIndex].comments}
                                            avatarUrl={pendingVideos[activeVideoIndex].avatarUrl}
                                            rooms={pendingVideos[activeVideoIndex].rooms}
                                            propertyType={pendingVideos[activeVideoIndex].propertyType}
                                            space={pendingVideos[activeVideoIndex].space}
                                            photos={pendingVideos[activeVideoIndex].photos}
                                            location={pendingVideos[activeVideoIndex].location}
                                            title={pendingVideos[activeVideoIndex].title}
                                            externalButtons={true}
                                            isActive={true}
                                        />
                                    </div>

                                    {/* Property details and action buttons */}
                                    <div className="w-full md:w-1/2">
                                        <h3 className="text-lg font-semibold mb-3">{pendingVideos[activeVideoIndex].title}</h3>

                                        <div className="mb-4">
                                            <h4 className="font-medium text-gray-700">Property Details</h4>
                                            <ul className="mt-2 space-y-2 text-sm">
                                                <li className="flex">
                                                    <span className="text-gray-500 w-28">Property Type:</span>
                                                    <span className="font-medium">{pendingVideos[activeVideoIndex].propertyType}</span>
                                                </li>
                                                <li className="flex">
                                                    <span className="text-gray-500 w-28">Rooms:</span>
                                                    <span className="font-medium">{pendingVideos[activeVideoIndex].rooms}</span>
                                                </li>
                                                <li className="flex">
                                                    <span className="text-gray-500 w-28">Area:</span>
                                                    <span className="font-medium">{pendingVideos[activeVideoIndex].space} m²</span>
                                                </li>
                                                <li className="flex">
                                                    <span className="text-gray-500 w-28">Location:</span>
                                                    <span className="font-medium">{pendingVideos[activeVideoIndex].location?.city || 'N/A'}</span>
                                                </li>
                                            </ul>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="font-medium text-gray-700">Description</h4>
                                            <p className="mt-2 text-sm text-gray-600">{pendingVideos[activeVideoIndex].caption}</p>
                                        </div>

                                        <div className="mb-4">
                                            <h4 className="font-medium text-gray-700">Submitter</h4>
                                            <div className="mt-2 flex items-center">
                                                <img
                                                    src={pendingVideos[activeVideoIndex].avatarUrl || "https://via.placeholder.com/40"}
                                                    alt={pendingVideos[activeVideoIndex].username}
                                                    className="w-8 h-8 rounded-full mr-3"
                                                />
                                                <span className="text-sm">{pendingVideos[activeVideoIndex].username}</span>
                                            </div>
                                        </div>

                                        <div className="flex space-x-4 mt-6">
                                            <button
                                                onClick={() => handleApprove(pendingVideos[activeVideoIndex].id)}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition"
                                            >
                                                Approve
                                            </button>
                                            <button
                                                onClick={() => setShowRejectModal(true)}
                                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition"
                                            >
                                                Reject
                                            </button>
                                        </div>

                                        {/* Video navigation */}
                                        <div className="flex justify-between items-center mt-8">
                                            <button
                                                disabled={activeVideoIndex === 0}
                                                onClick={() => setActiveVideoIndex(prev => prev - 1)}
                                                className={`px-4 py-2 rounded ${activeVideoIndex === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                            >
                                                Previous Video
                                            </button>
                                            <span className="text-sm text-gray-500">
                                                {activeVideoIndex + 1} of {pendingVideos.length}
                                            </span>
                                            <button
                                                disabled={activeVideoIndex === pendingVideos.length - 1}
                                                onClick={() => setActiveVideoIndex(prev => prev + 1)}
                                                className={`px-4 py-2 rounded ${activeVideoIndex === pendingVideos.length - 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                                            >
                                                Next Video
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* List of other pending videos */}
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold mb-3">All Pending Videos</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {pendingVideos.map((video, index) => (
                                        <div
                                            key={video.id}
                                            onClick={() => setActiveVideoIndex(index)}
                                            className={`p-4 border ${index === activeVideoIndex ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'} rounded-lg cursor-pointer transition-colors`}
                                        >
                                            <div className="flex items-start">
                                                <div className="w-24 h-16 bg-gray-200 rounded overflow-hidden mr-3">
                                                    {/* Video thumbnail - could be first frame or generated thumbnail */}
                                                    <img
                                                        src={video.photos?.[0]?.photoUrl || "https://via.placeholder.com/96x64?text=Video"}
                                                        alt={video.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                                                    <p className="text-xs text-gray-500 mt-1">By {video.username}</p>
                                                    <p className="text-xs text-gray-500 mt-1">{video.propertyType} • {video.rooms} rooms</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Rejection Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <h3 className="text-xl font-bold mb-4">Reject Video</h3>
                        <p className="text-gray-600 mb-4">Please provide a reason for rejecting this video:</p>

                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                            placeholder="Explain why this video doesn't meet the requirements..."
                        ></textarea>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleReject(pendingVideos[activeVideoIndex].id)}
                                disabled={!rejectionReason.trim()}
                                className={`px-4 py-2 rounded-md text-white ${rejectionReason.trim() ? 'bg-red-600 hover:bg-red-700' : 'bg-red-400 cursor-not-allowed'}`}
                            >
                                Reject Video
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;