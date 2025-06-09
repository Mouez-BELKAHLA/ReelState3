import React, { useState } from 'react';
import NotImplementedMessage from '../../../shared/components/Common/NotImplementedMessage';

interface FacebookSignInButtonProps {
    variant?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    className?: string;
}

const FacebookSignInButton: React.FC<FacebookSignInButtonProps> = ({
    variant = 'signin_with',
    className = ''
}) => {
    const [showNotImplemented, setShowNotImplemented] = useState(false);

    const handleFacebookClick = () => {
        setShowNotImplemented(true);
    };

    const getButtonText = () => {
        switch (variant) {
            case 'signup_with':
                return 'Sign up with Facebook';
            case 'continue_with':
                return 'Continue with Facebook';
            case 'signin':
                return 'Sign in';
            default:
                return 'Sign in with Facebook';
        }
    };

    return (
        <>
            <div className={`facebook-signin-button w-full ${className}`} style={{ minHeight: '40px' }}>
                <button
                    type="button"
                    onClick={handleFacebookClick}
                    className="w-full"
                    style={{
                        backgroundColor: '#fff',
                        border: '1px solid #dadce0',
                        borderRadius: '4px',
                        color: '#3c4043',
                        cursor: 'pointer',
                        fontFamily: 'Roboto, arial, sans-serif',
                        fontSize: '14px',
                        height: '40px',
                        letterSpacing: '0.25px',
                        outline: 'none',
                        overflow: 'hidden',
                        padding: '0',
                        position: 'relative',
                        textAlign: 'center',
                        transition: 'background-color .218s, border-color .218s, box-shadow .218s',
                        verticalAlign: 'middle',
                        whiteSpace: 'nowrap',
                        width: '100%',
                        maxWidth: '400px',
                        minWidth: 'min-content'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                        e.currentTarget.style.borderColor = '#dadce0';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#dadce0';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                    onFocus={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#4285f4';
                        e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(60,64,67,.30), 0 1px 3px 1px rgba(60,64,67,.15)';
                    }}
                    onBlur={(e) => {
                        e.currentTarget.style.backgroundColor = '#fff';
                        e.currentTarget.style.borderColor = '#dadce0';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div style={{
                        alignItems: 'center',
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'center', // Back to center for overall layout
                        flexWrap: 'nowrap',
                        height: '100%',
                        position: 'relative',
                        width: '100%',
                        paddingLeft: '12px',
                        paddingRight: '12px'
                    }}>
                        <div style={{
                            marginRight: '12px',
                            minWidth: '20px',
                            width: '20px',
                            flexShrink: 0,
                            position: 'absolute', // Position logo absolutely
                            left: '12px' // Fixed distance from left edge
                        }}>
                            <svg
                                width="20"
                                height="20"
                                viewBox="0 0 24 24"
                                fill="none"
                            >
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
                            </svg>
                        </div>
                        <span style={{
                            color: '#3c4043',
                            fontSize: '14px',
                            fontWeight: '500',
                            fontFamily: 'Roboto, arial, sans-serif',
                            letterSpacing: '0.25px',
                            lineHeight: '16px',
                            textAlign: 'center', // Center the text
                            width: '100%' // Full width for centering
                        }}>
                            {getButtonText()}
                        </span>
                    </div>
                </button>
            </div>

            {showNotImplemented && (
                <NotImplementedMessage
                    message="Facebook login is coming soon!"
                    onClose={() => setShowNotImplemented(false)}
                />
            )}
        </>
    );
};

export default FacebookSignInButton;