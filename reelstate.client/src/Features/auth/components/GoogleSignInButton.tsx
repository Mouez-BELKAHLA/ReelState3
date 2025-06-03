import React, { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GOOGLE_CLIENT_ID } from '../Constants/auth';
import { useAppDispatch } from '../../../store/hooks';
import { googleLogin } from '../../../store/slices/authSlice';
import { API_URL } from '../../../shared/services/config';

interface GoogleSignInButtonProps {
    variant?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    className?: string;
}

// Google API type definitions
interface GoogleInitializeConfig {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    auto_select?: boolean;
    login_uri?: string;
    native_callback?: () => void;
    cancel_on_tap_outside?: boolean;
    prompt_parent_id?: string;
    nonce?: string;
    context?: string;
    state_cookie_domain?: string;
    ux_mode?: 'popup' | 'redirect';
    allowed_parent_origin?: string | string[];
    intermediate_iframe_close_callback?: () => void;
}

interface GoogleButtonOptions {
    type: 'standard' | 'icon';
    theme: 'outline' | 'filled_blue' | 'filled_black';
    size: 'large' | 'medium' | 'small';
    text: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    shape: 'rectangular' | 'pill' | 'circle' | 'square';
    logo_alignment: 'left' | 'center';
    width?: number;
    locale?: string;
}

interface GoogleCredentialResponse {
    credential: string;
    select_by?: 'auto' | 'user' | 'user_1tap' | 'user_2tap' | 'btn' | 'btn_confirm' | 'btn_add_session' | 'btn_confirm_add_session';
    clientId?: string;
}

// Update the global window interface
declare global {
    interface Window {
        google?: {
            accounts: {
                id: {
                    initialize: (config: GoogleInitializeConfig) => void;
                    renderButton: (element: HTMLElement, options: GoogleButtonOptions) => void;
                    prompt: () => void;
                    disableAutoSelect: () => void;
                    storeCredential: (credential: { id: string; password: string }, callback?: () => void) => void;
                    cancel: () => void;
                    revoke: (userId: string, callback?: () => void) => void;
                };
            };
        };
    }
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
                console.log("Current hostname:", window.location.hostname);
                console.log("Using API URL:", API_URL);

                await dispatch(googleLogin(response.credential)).unwrap();
                navigate('/dashboard');
            }
        } catch (error) {
            console.error('Google sign-in error:', error);
            // Show user-friendly error on mobile
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                alert("Sign-in failed. Please try again or use email login.");
            }
        }
    }, [dispatch, navigate]);

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
                    text: variant as 'signin_with' | 'signup_with' | 'continue_with' | 'signin',
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

export default GoogleSignInButton;