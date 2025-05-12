import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from "../../../shared"; // Use shared barrel file
import { VideoUploader } from ".."; // Import from property feature barrel
import { getErrorMessage } from "../../../shared/helpers"; // Import error helpers
import { useAppSelector } from "../../../store/hooks"; // Import Redux hooks

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
        photos: [] as File[]
    });

    // We can remove videoPreview state since it's now handled in VideoUploader
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
                photosCount: formData.photos.length
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
                    photos: []
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