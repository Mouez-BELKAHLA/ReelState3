import React, { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../Hooks/useAuth';
import { GOOGLE_CLIENT_ID } from '../Constants/auth';

// Strongly typed interfaces for Google Identity Services API
interface GoogleCredentialResponse {
    credential: string;
    select_by?: string;
    clientId?: string;
}

interface GoogleInitializeConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    cancel_on_tap_outside?: boolean;
    context?: string;
    state_cookie_domain?: string;
    prompt_parent_id?: string;
    nonce?: string;
    use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonOptions {
    type?: 'standard' | 'icon';
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'large' | 'medium' | 'small';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment?: 'left' | 'center';
    width?: number | string;
    locale?: string;
}

interface GoogleSignInButtonProps {
    variant?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    className?: string;
}

const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
    variant = 'signin_with',
    className = ''
}) => {
    const { googleLogin } = useAuth();
    const googleButtonRef = useRef<HTMLDivElement>(null);

    const handleGoogleResponse = useCallback(async (response: GoogleCredentialResponse) => {
        console.log("===== COPY THIS GOOGLE TOKEN =====");
        console.log(response.credential);
        console.log("==================================");
        try {
            if (response.credential) {
                console.log("Google sign-in successful, processing token...");
                await googleLogin(response.credential);
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
        }
    }, [googleLogin]);

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

// Properly typed window object extension for Google Identity Services
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleInitializeConfig) => void;
                    renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
                };
            };
        };
    }
}

export default GoogleSignInButton;