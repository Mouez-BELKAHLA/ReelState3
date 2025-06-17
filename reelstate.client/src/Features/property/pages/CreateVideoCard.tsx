import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../../shared"; // Use shared barrel file
import { VideoUploader } from ".."; // Import from property feature barrel
import { getErrorMessage } from "../../../shared/helpers"; // Import error helpers
import { useAppSelector } from "../../../store/hooks"; // Import Redux hooks
import NotImplementedMessage from "../../../shared/components/Common/NotImplementedMessage";

// Define property preferences array
const propertyPreferences = [
    'Modern', 'Traditional', 'Spacious', 'Compact', 'Urban', 'Rural',
    'Near amenities', 'Quiet location', 'Family-friendly', 'Investment',
    'Luxury', 'Budget-friendly', 'Renovation potential', 'Move-in ready'
];

// Define property features array
const propertyFeatures = [
    'Parking', 'Garden', 'Balcony', 'Pool', 'Elevator',
    'Air conditioning', 'Heating', 'Furnished', 'Pet friendly',
    'Security system', 'Storage room', 'Gym', 'Laundry'
];

const CreateVideoCard: React.FC = () => {
    // Get auth state from Redux
    const { user, token } = useAppSelector(state => state.auth);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        title: '',
        caption: '',
        rooms: 2,
        propertyType: 'apartment',
        space: 75,
        address: '',
        city: '',
        lat: 0,
        lng: 0,
        video: null as File | null,
        photos: [] as File[],
        // Add property preferences and features
        propertyPreferences: [] as string[],
        propertyFeatures: [] as string[],
        // Social media platforms
        socialPlatforms: {
            youtube: false,
            tiktok: false,
            instagram: false,
            facebook: false
        }
    });

    // We can remove videoPreview state since it's now handled in VideoUploader
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Social media integration messages
    const [showYouTubeMessage, setShowYouTubeMessage] = useState(false);
    const [showTikTokMessage, setShowTikTokMessage] = useState(false);
    const [showInstagramMessage, setShowInstagramMessage] = useState(false);
    const [showFacebookMessage, setShowFacebookMessage] = useState(false);

    // We can keep this for photo uploads
    const photoInputRef = useRef<HTMLInputElement>(null);

    const propertyTypes = ["apartment", "house", "studio", "villa", "loft", "land"];

    // Move the loading check to useEffect
    useEffect(() => {
        if (user) {
            setIsLoading(false);
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rooms' || name === 'space' || name === 'lat' || name === 'lng'
                ? parseFloat(value)
                : value
        }));
    };

    // Function to toggle preference selection
    const togglePreference = (preference: string) => {
        setFormData(prev => {
            if (prev.propertyPreferences.includes(preference)) {
                return {
                    ...prev,
                    propertyPreferences: prev.propertyPreferences.filter(p => p !== preference)
                };
            } else {
                return {
                    ...prev,
                    propertyPreferences: [...prev.propertyPreferences, preference]
                };
            }
        });
    };

    // Function to toggle feature selection
    const toggleFeature = (feature: string) => {
        setFormData(prev => {
            if (prev.propertyFeatures.includes(feature)) {
                return {
                    ...prev,
                    propertyFeatures: prev.propertyFeatures.filter(f => f !== feature)
                };
            } else {
                return {
                    ...prev,
                    propertyFeatures: [...prev.propertyFeatures, feature]
                };
            }
        });
    };

    // Handle social media platform checkbox changes
    const handleSocialPlatformChange = (platform: keyof typeof formData.socialPlatforms) => {
        // Show appropriate message based on platform
        switch (platform) {
            case 'youtube':
                setShowYouTubeMessage(true);
                break;
            case 'tiktok':
                setShowTikTokMessage(true);
                break;
            case 'instagram':
                setShowInstagramMessage(true);
                break;
            case 'facebook':
                setShowFacebookMessage(true);
                break;
        }

        // Update the checkbox state
        setFormData(prev => ({
            ...prev,
            socialPlatforms: {
                ...prev.socialPlatforms,
                [platform]: !prev.socialPlatforms[platform]
            }
        }));
    };

    // This function will be passed to VideoUploader to update video in formData
    const handleVideoChange = (file: File | null) => {
        setFormData(prev => ({ ...prev, video: file }));
        // Clear any previous error messages when a new video is selected
        setError(null);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);

        const invalidFiles = filesArray.filter(file => !file.type.includes('image/'));
        if (invalidFiles.length > 0) {
            setError('All files must be images.');
            return;
        }

        const tooLargeFiles = filesArray.filter(file => file.size > 3 * 1024 * 1024);
        if (tooLargeFiles.length > 0) {
            setError('Each image must not exceed 3MB.');
            return;
        }

        if (formData.photos.length + filesArray.length > 5) {
            setError('Maximum 5 photos allowed.');
            return;
        }

        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, ...filesArray]
        }));

        const newUrls = filesArray.map(file => URL.createObjectURL(file));
        setPhotoPreviewUrls(prev => [...prev, ...newUrls]);
        setError(null);
    };

    const removePhoto = (index: number) => {
        const newPhotos = formData.photos.filter((_, i) => i !== index);
        const newPreviews = photoPreviewUrls.filter((_, i) => i !== index);

        setFormData(prev => ({ ...prev, photos: newPhotos }));
        setPhotoPreviewUrls(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        setSuccess(null);

        if (!formData.title || !formData.caption || !formData.video) {
            setError('Please fill in all required fields and upload a video.');
            setIsSubmitting(false);
            return;
        }

        try {
            const submitData = new FormData();

            // Use the property names that match the C# model (PascalCase)
            submitData.append('Title', formData.title);
            submitData.append('Caption', formData.caption);
            submitData.append('Rooms', formData.rooms.toString());
            submitData.append('PropertyType', formData.propertyType);
            submitData.append('Space', formData.space.toString());
            submitData.append('Address', formData.address);
            submitData.append('City', formData.city);
            submitData.append('Latitude', formData.lat.toString());
            submitData.append('Longitude', formData.lng.toString());

            // Add preferences and features as JSON strings
            submitData.append('PropertyPreferences', JSON.stringify(formData.propertyPreferences));
            submitData.append('PropertyFeatures', JSON.stringify(formData.propertyFeatures));

            // Add social media platform preferences
            submitData.append('UploadToYouTube', formData.socialPlatforms.youtube.toString());
            submitData.append('UploadToTikTok', formData.socialPlatforms.tiktok.toString());
            submitData.append('UploadToInstagram', formData.socialPlatforms.instagram.toString());
            submitData.append('UploadToFacebook', formData.socialPlatforms.facebook.toString());

            if (user && user.id) {
                submitData.append('UserId', user.id);
            }

            if (formData.video) {
                submitData.append('VideoFile', formData.video);
            }

            formData.photos.forEach(photo => {
                submitData.append('PhotoFiles', photo);
            });

            console.log("Submitting property with data:", {
                title: formData.title,
                caption: formData.caption,
                videoSize: formData.video?.size || 0,
                photosCount: formData.photos.length,
                preferences: formData.propertyPreferences,
                features: formData.propertyFeatures,
                socialPlatforms: formData.socialPlatforms
            });

            // Use token from Redux
            const response = await axios.post(`${API_URL}/api/Property/create`, submitData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
                timeout: 60000, // 60 second timeout
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
                    console.log(`Upload progress: ${percentCompleted}%`);
                }
            });

            console.log('Property creation response:', response.data);

            if (response.data.isSuccess) {
                setSuccess('Your property listing was created successfully!');

                setFormData({
                    title: '',
                    caption: '',
                    rooms: 2,
                    propertyType: 'apartment',
                    space: 75,
                    address: '',
                    city: '',
                    lat: 0,
                    lng: 0,
                    video: null,
                    photos: [],
                    propertyPreferences: [],
                    propertyFeatures: [],
                    socialPlatforms: {
                        youtube: false,
                        tiktok: false,
                        instagram: false,
                        facebook: false
                    }
                });

                setPhotoPreviewUrls([]);

                if (photoInputRef.current) photoInputRef.current.value = '';

                setTimeout(() => {
                    navigate('/feed');
                }, 2000);
            } else {
                setError(response.data.message || 'An error occurred while creating the listing.');
            }

        } catch (err: unknown) {
            console.error('Error submitting property:', err);

            // Use the error helper to extract a meaningful message
            let errorMessage = getErrorMessage(
                err,
                'An error occurred while creating the listing. Please try again.'
            );

            // Special handling for network errors which might be due to large file uploads
            if (axios.isAxiosError(err)) {
                if (err.code === 'ERR_NETWORK') {
                    errorMessage = 'Network error. The server may be down or the request might be too large.';
                } else if (err.response?.data?.message) {
                    // If the API returned a specific error message
                    errorMessage = err.response.data.message;
                }
            }

            // Set the error message for display
            setError(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Show loading indicator while waiting for user data
    if (isLoading) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    // Main render
    return (
        <div className="bg-gray-100 min-h-screen">
            {/* Social Media Integration Messages */}
            {showYouTubeMessage && (
                <NotImplementedMessage
                    message="YouTube Shorts integration coming soon! We'll automatically upload your video as a YouTube Short."
                    onClose={() => setShowYouTubeMessage(false)}
                />
            )}
            {showTikTokMessage && (
                <NotImplementedMessage
                    message="TikTok integration coming soon! Your video will be posted as a TikTok reel."
                    onClose={() => setShowTikTokMessage(false)}
                />
            )}
            {showInstagramMessage && (
                <NotImplementedMessage
                    message="Instagram Reels integration coming soon! Your video will be shared as an Instagram Reel."
                    onClose={() => setShowInstagramMessage(false)}
                />
            )}
            {showFacebookMessage && (
                <NotImplementedMessage
                    message="Facebook Reels integration coming soon! Your video will be posted as a Facebook Reel."
                    onClose={() => setShowFacebookMessage(false)}
                />
            )}

            <div className="container mx-auto px-4 py-8 pb-12">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Create Listing</h1>

                <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 max-w-4xl mx-auto">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Left column - Basic Info */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Title*
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Beautiful bright apartment in downtown"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description*
                                    </label>
                                    <textarea
                                        name="caption"
                                        value={formData.caption}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={3}
                                        placeholder="Describe your property in a few sentences"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Rooms
                                        </label>
                                        <input
                                            type="number"
                                            name="rooms"
                                            min="1"
                                            max="20"
                                            value={formData.rooms}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Type
                                        </label>
                                        <select
                                            name="propertyType"
                                            value={formData.propertyType}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {propertyTypes.map(type => (
                                                <option key={type} value={type}>
                                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Area (m²)
                                        </label>
                                        <input
                                            type="number"
                                            name="space"
                                            min="1"
                                            max="2000"
                                            value={formData.space}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Address
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: 123 Main Street"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            City
                                        </label>
                                        <input
                                            type="text"
                                            name="city"
                                            value={formData.city}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ex: Paris"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Latitude
                                        </label>
                                        <input
                                            type="number"
                                            name="lat"
                                            step="0.000001"
                                            value={formData.lat}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="48.8566"
                                        />
                                    </div>

                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Longitude
                                        </label>
                                        <input
                                            type="number"
                                            name="lng"
                                            step="0.000001"
                                            value={formData.lng}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="2.3522"
                                        />
                                    </div>
                                </div>

                                {/* Property Preferences Section - NEW */}
                                <div className="border-t pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Property Style & Preferences
                                        <span className="text-gray-500 text-xs block mt-1">
                                            Select all that apply to help buyers find your property
                                        </span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {propertyPreferences.map(preference => (
                                            <button
                                                key={preference}
                                                type="button"
                                                onClick={() => togglePreference(preference)}
                                                className={`px-3 py-1 text-sm rounded-full ${formData.propertyPreferences.includes(preference)
                                                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                                                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                                                    } transition-colors`}
                                            >
                                                {preference}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Property Features Section - NEW */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Property Features & Amenities
                                        <span className="text-gray-500 text-xs block mt-1">
                                            Select all features this property offers
                                        </span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {propertyFeatures.map(feature => (
                                            <button
                                                key={feature}
                                                type="button"
                                                onClick={() => toggleFeature(feature)}
                                                className={`px-3 py-1 text-sm rounded-full ${formData.propertyFeatures.includes(feature)
                                                        ? 'bg-green-100 text-green-800 border border-green-300'
                                                        : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                                                    } transition-colors`}
                                            >
                                                {feature}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Social Media Integration Section */}
                                <div className="border-t pt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Share to Social Media Platforms
                                        <span className="text-gray-500 text-xs block mt-1">
                                            Select platforms to automatically share your property video
                                        </span>
                                    </label>

                                    <div className="grid grid-cols-2 gap-3">
                                        {/* YouTube */}
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.socialPlatforms.youtube}
                                                onChange={() => handleSocialPlatformChange('youtube')}
                                                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <svg className="h-5 w-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">YouTube Shorts</span>
                                            </div>
                                        </label>

                                        {/* TikTok */}
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.socialPlatforms.tiktok}
                                                onChange={() => handleSocialPlatformChange('tiktok')}
                                                className="h-4 w-4 text-black focus:ring-gray-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <svg className="h-5 w-5 text-black mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">TikTok</span>
                                            </div>
                                        </label>

                                        {/* Instagram */}
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.socialPlatforms.instagram}
                                                onChange={() => handleSocialPlatformChange('instagram')}
                                                className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <svg className="h-5 w-5 text-pink-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">Instagram Reels</span>
                                            </div>
                                        </label>

                                        {/* Facebook */}
                                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.socialPlatforms.facebook}
                                                onChange={() => handleSocialPlatformChange('facebook')}
                                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                            />
                                            <div className="ml-3 flex items-center">
                                                <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                </svg>
                                                <span className="text-sm font-medium text-gray-700">Facebook Reels</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Right column - Media uploads */}
                            <div className="space-y-6">
                                {/* Using the VideoUploader component */}
                                <VideoUploader
                                    videoFile={formData.video}
                                    onVideoChange={handleVideoChange}
                                    maxSize={50}
                                />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Property Photos <span className="text-gray-500 text-xs">(max 3MB each, 5 photos max)</span>
                                    </label>

                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                        <div className="space-y-1 text-center">
                                            <svg
                                                className="mx-auto h-12 w-12 text-gray-400"
                                                stroke="currentColor"
                                                fill="none"
                                                viewBox="0 0 48 48"
                                                aria-hidden="true"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                />
                                            </svg>
                                            <div className="flex text-sm text-gray-600">
                                                <label
                                                    htmlFor="photo-upload"
                                                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                                >
                                                    <span>Upload photos</span>
                                                    <input
                                                        id="photo-upload"
                                                        ref={photoInputRef}
                                                        name="photo-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        multiple
                                                        className="sr-only"
                                                        onChange={handlePhotoUpload}
                                                    />
                                                </label>
                                                <p className="pl-1">or drag and drop</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF up to 3MB</p>
                                        </div>
                                    </div>

                                    {/* Photo previews */}
                                    {photoPreviewUrls.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-3">
                                            {photoPreviewUrls.map((url, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={url}
                                                        alt={`Property photo ${index + 1}`}
                                                        className="h-20 w-full object-cover rounded"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors ${isSubmitting
                                    ? 'bg-blue-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700'
                                    }`}
                            >
                                {isSubmitting ? 'Creating...' : 'Create Listing'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateVideoCard;