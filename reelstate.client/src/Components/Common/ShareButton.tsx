import React from 'react';

type ShareButtonProps = {
    title?: string;
    text?: string;
    url?: string;
    customUrl?: (id: string) => string;
    id: string;
    className?: string;
    iconClassName?: string;
    textClassName?: string;
    showText?: boolean;
    onShareSuccess?: () => void;
    onShareError?: (error: unknown) => void;
};

export default function ShareButton({
    title = 'Check out this property!',
    text = 'I found this amazing property you might like.',
    url,
    customUrl,
    id,
    className = "backdrop-blur-lg bg-transparent rounded-full p-1.5 hover:bg-green-500/30 transition-all border border-white/20 flex items-center justify-center",
    iconClassName = "w-5 h-5 text-white",
    textClassName = "text-white text-xs font-medium mt-2",
    showText = true,
    onShareSuccess,
    onShareError
}: ShareButtonProps) {
    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering other click events

        // Get the URL to share
        const shareUrl = customUrl ? customUrl(id) : url || window.location.href;
        const finalUrl = shareUrl.includes('?') ? `${shareUrl}&property=${id}` : `${shareUrl}?property=${id}`;

        // Check if the Web Share API is available
        if (navigator.share) {
            navigator.share({
                title,
                text,
                url: finalUrl
            })
                .then(() => {
                    if (onShareSuccess) onShareSuccess();
                })
                .catch(error => {
                    console.error('Error sharing:', error);
                    if (onShareError) onShareError(error);
                });
        } else {
            // Fallback for browsers that don't support the Web Share API
            prompt('Copy this link to share:', finalUrl);
        }
    };

    return (
        <div className="flex flex-col items-center" style={{ height: showText ? '48px' : 'auto', width: '34px' }}>
            <button
                onClick={handleShare}
                className={className}
                style={{ width: '34px', height: '34px' }}
                aria-label="Share"
            >
                <svg className={iconClassName} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                </svg>
            </button>
            {showText && <span className={textClassName}>Share</span>}
        </div>
    );
}