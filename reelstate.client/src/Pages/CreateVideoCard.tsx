import React, { useState, useRef } from 'react';
import { useAuth } from '../Hooks/useAuth';

type PropertyFormData = {
    title: string;
    caption: string;
    rooms: number;
    propertyType: string;
    space: number;
    address: string;
    city: string;
    lat: number;
    lng: number;
    video: File | null;
    photos: File[];
}

const CreateVideoCard: React.FC = () => {
    const { authState, logout } = useAuth();

    // Debug logs matching Dashboard pattern
    console.log("CreateVideoCard rendering, authState:", authState);

    // Extract user from authState using the same pattern as Dashboard
    const { user } = authState;

    // Add more debugging
    console.log("user from authState:", user);

    const [formData, setFormData] = useState<PropertyFormData>({
        title: '',
        caption: '',
        rooms: 2,
        propertyType: 'appartement',
        space: 75,
        address: '',
        city: '',
        lat: 0,
        lng: 0,
        video: null,
        photos: []
    });

    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const videoInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);

    const propertyTypes = ["appartement", "villa", "studio", "maison", "loft", "terrain"];

    // If user is not loaded yet, show loading state
    if (!user) {
        return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rooms' || name === 'space' || name === 'lat' || name === 'lng'
                ? parseFloat(value)
                : value
        }));
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.includes('video/')) {
            setError('Le fichier doit être un format vidéo.');
            return;
        }

        if (file.size > 100 * 1024 * 1024) { // 100MB max
            setError('La taille de la vidéo ne doit pas dépasser 100MB.');
            return;
        }

        setFormData(prev => ({ ...prev, video: file }));
        setVideoPreview(URL.createObjectURL(file));
        setError(null);
    };

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        // Convert FileList to array
        const filesArray = Array.from(files);

        // Validate file types and sizes
        const invalidFiles = filesArray.filter(file => !file.type.includes('image/'));
        if (invalidFiles.length > 0) {
            setError('Tous les fichiers doivent être des images.');
            return;
        }

        const tooLargeFiles = filesArray.filter(file => file.size > 5 * 1024 * 1024); // 5MB max per image
        if (tooLargeFiles.length > 0) {
            setError('Chaque image ne doit pas dépasser 5MB.');
            return;
        }

        // Update form data with new photos
        setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, ...filesArray]
        }));

        // Create and store preview URLs
        const newUrls = filesArray.map(file => URL.createObjectURL(file));
        setPhotoPreviewUrls(prev => [...prev, ...newUrls]);
        setError(null);
    };

    const removePhoto = (index: number) => {
        // Create new arrays without the item at the specified index
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

        // Validate form
        if (!formData.title || !formData.caption || !formData.video) {
            setError('Veuillez remplir tous les champs obligatoires et télécharger une vidéo.');
            setIsSubmitting(false);
            return;
        }

        try {
            // In a real application, you would upload the files and submit the form data to your API
            // For this example, we'll just simulate a successful submission

            // Create a FormData object to send files and data
            const submitData = new FormData();
            submitData.append('title', formData.title);
            submitData.append('caption', formData.caption);
            submitData.append('rooms', formData.rooms.toString());
            submitData.append('propertyType', formData.propertyType);
            submitData.append('space', formData.space.toString());
            submitData.append('address', formData.address);
            submitData.append('city', formData.city);
            submitData.append('lat', formData.lat.toString());
            submitData.append('lng', formData.lng.toString());

            // Add user information from authState
            if (user && user.id) {
                submitData.append('userId', user.id);
            }

            if (formData.video) {
                submitData.append('video', formData.video);
            }

            formData.photos.forEach((photo) => {
                submitData.append('photos', photo);
            });

            // Here you would make an API call to your backend
            // const response = await api.post('/api/properties', submitData);

            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Success
            setSuccess('Votre annonce immobilière a été créée avec succès!');

            // Reset form
            setFormData({
                title: '',
                caption: '',
                rooms: 2,
                propertyType: 'appartement',
                space: 75,
                address: '',
                city: '',
                lat: 0,
                lng: 0,
                video: null,
                photos: []
            });
            setVideoPreview(null);
            setPhotoPreviewUrls([]);

            // Reset file inputs
            if (videoInputRef.current) videoInputRef.current.value = '';
            if (photoInputRef.current) photoInputRef.current.value = '';

        } catch (err) {
            setError('Une erreur est survenue lors de la création de l\'annonce. Veuillez réessayer.');
            console.error('Error submitting property:', err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-gray-100 min-h-screen py-8">
            {/* Header - similar to Dashboard */}
            <header className="bg-white shadow mb-8">
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <h1 className="text-3xl font-bold text-gray-900">Créer une annonce</h1>
                    <div className="flex items-center gap-4">
                        {user.profilePictureUrl && (
                            <img
                                src={user.profilePictureUrl}
                                alt="Profile"
                                className="w-10 h-10 rounded-full object-cover"
                            />
                        )}
                        <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                                {user.firstName.toUpperCase()} {user.lastName.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                        <button
                            onClick={() => logout()}
                            className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            LOGOUT
                        </button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4">
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
                                        Titre*
                                    </label>
                                    <input
                                        type="text"
                                        name="title"
                                        value={formData.title}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: Magnifique appartement lumineux au cœur de Lyon"
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
                                        placeholder="Décrivez votre bien immobilier en quelques phrases"
                                        required
                                    />
                                </div>

                                {/* Rest of the form fields */}
                                {/* ... */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Pièces
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
                                            Surface (m²)
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
                                        Adresse
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ex: 123 Rue de la République"
                                    />
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Ville
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
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Vidéo du bien* <span className="text-gray-500 text-xs">(max 100MB)</span>
                                    </label>
                                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                                        {videoPreview ? (
                                            <div className="space-y-2 w-full">
                                                <video
                                                    src={videoPreview}
                                                    className="h-40 mx-auto rounded"
                                                    controls
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setVideoPreview(null);
                                                        setFormData(prev => ({ ...prev, video: null }));
                                                        if (videoInputRef.current) videoInputRef.current.value = '';
                                                    }}
                                                    className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                                >
                                                    Supprimer
                                                </button>
                                            </div>
                                        ) : (
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
                                                        d="M8 14.5A2.5 2.5 0 0110.5 12h4.92a2.5 2.5 0 011.768.732l1.962 1.962a2.5 2.5 0 001.768.732H32.5a2.5 2.5 0 012.5 2.5v18a2.5 2.5 0 01-2.5 2.5h-22A2.5 2.5 0 018 35.5v-21z"
                                                    />
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        strokeWidth={2}
                                                        d="M20 24l4 4 4-4m-4-4v8"
                                                    />
                                                </svg>
                                                <div className="flex text-sm text-gray-600">
                                                    <label
                                                        htmlFor="video-upload"
                                                        className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none"
                                                    >
                                                        <span>Télécharger une vidéo</span>
                                                        <input
                                                            id="video-upload"
                                                            ref={videoInputRef}
                                                            name="video-upload"
                                                            type="file"
                                                            accept="video/*"
                                                            className="sr-only"
                                                            onChange={handleVideoUpload}
                                                        />
                                                    </label>
                                                    <p className="pl-1">ou glisser-déposer</p>
                                                </div>
                                                <p className="text-xs text-gray-500">MP4, MOV, AVI ou autres formats vidéo</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Photos du bien <span className="text-gray-500 text-xs">(max 5MB chacune)</span>
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
                                                    <span>Télécharger des photos</span>
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
                                                <p className="pl-1">ou glisser-déposer</p>
                                            </div>
                                            <p className="text-xs text-gray-500">PNG, JPG, GIF jusqu'à 5MB</p>
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
                                {isSubmitting ? 'Création en cours...' : 'Créer l\'annonce'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CreateVideoCard;