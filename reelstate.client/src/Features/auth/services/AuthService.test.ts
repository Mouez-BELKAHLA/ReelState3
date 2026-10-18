import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import AuthService from './AuthService';

const successResponse = {
    isSuccess: true,
    token: 'access-token',
    refreshToken: 'refresh-token',
    userId: 'user-1',
    email: 'user@example.com',
    firstName: 'Test',
    lastName: 'User',
    profilePictureUrl: '',
    roles: ['User'],
};

const credentials = { Email: 'user@example.com', Password: 'Password1' };

describe('AuthService', () => {
    beforeEach(() => {
        localStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('login', () => {
        it('stores the token and user details and sets the Authorization header', async () => {
            const post = vi.spyOn(axios, 'post').mockResolvedValue({ data: successResponse });

            const result = await AuthService.login(credentials);

            expect(post).toHaveBeenCalledWith(expect.stringContaining('/api/Auth/login'), credentials);
            expect(result.isSuccess).toBe(true);
            expect(localStorage.getItem('token')).toBe('access-token');
            expect(localStorage.getItem('refreshToken')).toBe('refresh-token');
            expect(localStorage.getItem('userId')).toBe('user-1');
            expect(localStorage.getItem('email')).toBe('user@example.com');
            expect(axios.defaults.headers.common['Authorization']).toBe('Bearer access-token');
        });

        it('stores nothing when the server says the login failed', async () => {
            vi.spyOn(axios, 'post').mockResolvedValue({
                data: { isSuccess: false, message: 'Invalid email or password' },
            });

            await AuthService.login(credentials);

            expect(localStorage.getItem('token')).toBeNull();
            expect(AuthService.isAuthenticated()).toBe(false);
        });

        it('throws and stores nothing when the request fails', async () => {
            vi.spyOn(axios, 'post').mockRejectedValue(new Error('Network Error'));

            await expect(AuthService.login(credentials)).rejects.toBeDefined();

            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    describe('logout', () => {
        it('clears the stored data and removes the Authorization header', async () => {
            localStorage.setItem('token', 'access-token');
            localStorage.setItem('refreshToken', 'refresh-token');
            localStorage.setItem('userId', 'user-1');
            axios.defaults.headers.common['Authorization'] = 'Bearer access-token';

            await AuthService.logout();

            expect(localStorage.getItem('token')).toBeNull();
            expect(localStorage.getItem('refreshToken')).toBeNull();
            expect(localStorage.getItem('userId')).toBeNull();
            expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
            expect(AuthService.isAuthenticated()).toBe(false);
        });
    });

    describe('getCurrentUser', () => {
        it('returns null when there is no token', () => {
            expect(AuthService.getCurrentUser()).toBeNull();
        });

        it('returns the user stored in localStorage', () => {
            localStorage.setItem('token', 'access-token');
            localStorage.setItem('userId', 'user-1');
            localStorage.setItem('email', 'user@example.com');
            localStorage.setItem('firstName', 'Test');
            localStorage.setItem('lastName', 'User');

            expect(AuthService.getCurrentUser()).toEqual({
                id: 'user-1',
                email: 'user@example.com',
                firstName: 'Test',
                lastName: 'User',
                profilePictureUrl: '',
            });
        });

        it('falls back to the data inside the JWT when localStorage has no user', () => {
            const payload = btoa(
                JSON.stringify({ sub: 'user-9', email: 'jwt@example.com', given_name: 'Jwt', family_name: 'User' })
            );
            localStorage.setItem('token', 'header.' + payload + '.signature');

            expect(AuthService.getCurrentUser()).toEqual({
                id: 'user-9',
                email: 'jwt@example.com',
                firstName: 'Jwt',
                lastName: 'User',
                profilePictureUrl: '',
            });
        });
    });

    describe('refreshToken', () => {
        it('returns null and does not call the API when there are no stored tokens', async () => {
            const post = vi.spyOn(axios, 'post');

            const result = await AuthService.refreshToken();

            expect(result).toBeNull();
            expect(post).not.toHaveBeenCalled();
        });

        it('stores the new tokens when the refresh succeeds', async () => {
            localStorage.setItem('token', 'old-access');
            localStorage.setItem('refreshToken', 'old-refresh');
            const post = vi.spyOn(axios, 'post').mockResolvedValue({
                data: { ...successResponse, token: 'new-access', refreshToken: 'new-refresh' },
            });

            const result = await AuthService.refreshToken();

            expect(post).toHaveBeenCalledWith(expect.stringContaining('/api/Auth/refreshToken'), {
                Token: 'old-access',
                RefreshToken: 'old-refresh',
            });
            expect(result?.token).toBe('new-access');
            expect(localStorage.getItem('token')).toBe('new-access');
            expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
        });

        it('logs the user out when the refresh request fails', async () => {
            localStorage.setItem('token', 'old-access');
            localStorage.setItem('refreshToken', 'old-refresh');
            vi.spyOn(axios, 'post').mockRejectedValue(new Error('401'));

            const result = await AuthService.refreshToken();

            expect(result).toBeNull();
            expect(localStorage.getItem('token')).toBeNull();
        });
    });
});
