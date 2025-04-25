import { User, AuthResponse } from '../Types/Auth';
import { NavigateFunction } from 'react-router-dom';

export const handleAuthResponse = (response: AuthResponse): User => {
    if (response.isSuccess && response.token) {
        // Store user data in localStorage
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken || '');
        localStorage.setItem('userId', response.userId);
        localStorage.setItem('email', response.email);
        localStorage.setItem('firstName', response.firstName || '');
        localStorage.setItem('lastName', response.lastName || '');
        localStorage.setItem('profilePictureUrl', response.profilePictureUrl || '');

        const user: User = {
            id: response.userId,
            email: response.email,
            firstName: response.firstName,
            lastName: response.lastName,
            profilePictureUrl: response.profilePictureUrl
        };

        return user;
    }
    throw new Error(response.message || 'Authentication failed');
};

export const navigateToDashboard = (navigate: NavigateFunction): void => {
    navigate('/dashboard');
};

export const decodeToken = (token: string): any => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (error) {
        console.error('Error decoding token:', error);
        return null;
    }
};