import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_CLIENT_ID } from '../Constants/auth';
import { useAppDispatch } from '../../../store/hooks';
import { googleLogin } from '../../../store/slices/authSlice';

// Type definitions remain the same

interface GoogleSignInButtonProps {
    variant?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    variant = 'signin_with',
    className = ''
}) => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const handleGoogleResponse = useCallback(async (response: GoogleCredentialResponse) => {
        console.log("===== GOOGLE TOKEN RECEIVED =====");
        try {
            if (response.credential) {
                console.log("Google sign-in successful, processing token...");
                await dispatch(googleLogin(response.credential)).unwrap();
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
        }
    }, [dispatch, navigate]);

    // Rest of the component remains the same
    useEffect(() => {
        console.log("Current origin:", window.location.origin);

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);

        script.onload = () => {
            if (window.google && googleButtonRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse
                });

                window.google.accounts.id.renderButton(googleButtonRef.current, {
                    type: 'standard',
                    theme: 'outline',
                    size: 'large',
                    text: variant,
                    shape: 'rectangular',
                    logo_alignment: 'left',
                    width: googleButtonRef.current.clientWidth
                });
            }
        };

        return () => {
            const scriptElement = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
            if (scriptElement && scriptElement.parentNode) {
                scriptElement.parentNode.removeChild(scriptElement);
            }
        };
    }, [variant, handleGoogleResponse]);

    return (
        <div
            ref={googleButtonRef}
            className={`google-signin-button w-full ${className}`}
            style={{ minHeight: '40px' }}
        />
    );
};

// Type definitions remain the same
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: any) => void;
                    renderButton: (element: HTMLElement, options: any) => void;
                };
            };
        };
    }
}

export default GoogleSignInButton;