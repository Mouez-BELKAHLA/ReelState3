import React, { useRef, useState, useEffect } from 'react';

interface VideoUploaderProps {
    videoFile: File | null;
    onVideoChange: (file: File | null) => void;
    maxSize?: number; // in MB
}

const VideoUploader: React.FC<VideoUploaderProps> = ({
    videoFile,
    onVideoChange,
    maxSize = 50
}) => {
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    // Create preview when videoFile changes from outside the component
    useEffect(() => {
        // Clear any previous preview
        if (videoPreview) {
            URL.revokeObjectURL(videoPreview);
        }

        // If there's a new video file, create a preview
        if (videoFile) {
            setVideoPreview(URL.createObjectURL(videoFile));
        } else {
            setVideoPreview(null);
        }

        // Clean up the URL object when component unmounts or videoFile changes
        return () => {
            if (videoPreview) {
                URL.revokeObjectURL(videoPreview);
            }
        };
    }, [videoFile]);

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.includes('video/')) {
            setError('File must be a video format.');
            return;
        }

        if (file.size > maxSize * 1024 * 1024) {
            setError(`Video size must not exceed ${maxSize}MB.`);
            return;
        }

        onVideoChange(file);
        setError(null);
    };

    const handleRemoveVideo = () => {
        onVideoChange(null);
        if (videoInputRef.current) videoInputRef.current.value = '';
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
                Property Video* <span className="text-gray-500 text-xs">(max {maxSize}MB)</span>
            </label>

            {error && (
                <div className="text-red-500 text-sm mb-2">
                    {error}
                </div>
            )}

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
                            onClick={handleRemoveVideo}
                            className="w-full py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                        >
                            Remove
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
                                <span>Upload a video</span>
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
                            <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">MP4, MOV, AVI or other video formats</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoUploader;