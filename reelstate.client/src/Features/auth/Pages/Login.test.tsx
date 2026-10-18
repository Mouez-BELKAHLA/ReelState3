import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login';
import { loginUser, setAuthError } from '../../../store/slices/authSlice';

const mocks = vi.hoisted(() => ({
    dispatch: vi.fn(),
    navigate: vi.fn(),
    state: {
        isLoading: false,
        error: null as string | null,
        isAuthenticated: false,
        user: null as { roles: string[] } | null,
    },
}));

vi.mock('..', () => ({
    GoogleSignInButton: () => <div>Google button</div>,
    FacebookSignInButton: () => <div>Facebook button</div>,
}));

vi.mock('../../../store/hooks', () => ({
    useAppDispatch: () => mocks.dispatch,
    useAppSelector: (selector: (state: { auth: typeof mocks.state }) => unknown) =>
        selector({ auth: mocks.state }),
}));

vi.mock('../../../store/slices/authSlice', () => ({
    loginUser: vi.fn((credentials: unknown) => ({ type: 'auth/loginUser', payload: credentials })),
    setAuthError: vi.fn((value: unknown) => ({ type: 'auth/setAuthError', payload: value })),
}));

vi.mock('react-router-dom', async (importOriginal) => ({
    ...(await importOriginal<typeof import('react-router-dom')>()),
    useNavigate: () => mocks.navigate,
}));

function renderLogin() {
    return render(
        <MemoryRouter>
            <Login />
        </MemoryRouter>
    );
}

async function fillAndSubmit() {
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/email/i), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password1');
    await user.click(screen.getByRole('button', { name: /sign in with email/i }));
}

describe('Login page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.state.isLoading = false;
        mocks.state.error = null;
        mocks.state.isAuthenticated = false;
        mocks.state.user = null;
        mocks.dispatch.mockReturnValue({ unwrap: () => Promise.resolve({ roles: ['User'] }) });
        vi.spyOn(console, 'log').mockImplementation(() => {});
        vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    it('shows the form, the register link and the social sign-in buttons', () => {
        renderLogin();

        expect(screen.getByRole('heading', { name: /sign in to reelstate/i })).toBeInTheDocument();
        expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in with email/i })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /create an account/i })).toHaveAttribute('href', '/register');
        expect(screen.getByText('Google button')).toBeInTheDocument();
        expect(screen.getByText('Facebook button')).toBeInTheDocument();
    });

    it('dispatches loginUser with the typed credentials and goes to the dashboard', async () => {
        renderLogin();

        await fillAndSubmit();

        expect(loginUser).toHaveBeenCalledWith({ Email: 'user@example.com', Password: 'Password1' });
        await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/dashboard'));
    });

    it('stays on the page when the login fails', async () => {
        mocks.dispatch.mockReturnValue({ unwrap: () => Promise.reject(new Error('Invalid email or password')) });
        renderLogin();

        await fillAndSubmit();

        await waitFor(() => expect(console.error).toHaveBeenCalledWith('Login failed:', expect.any(Error)));
        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('shows the error message from the store', () => {
        mocks.state.error = 'Invalid email or password';
        renderLogin();

        expect(screen.getByRole('alert')).toHaveTextContent('Invalid email or password');
    });

    it('disables the button and shows a loading text while signing in', () => {
        mocks.state.isLoading = true;
        renderLogin();

        expect(screen.getByRole('button', { name: /signing in/i })).toBeDisabled();
    });

    it('redirects to the dashboard when the user is already authenticated', () => {
        mocks.state.isAuthenticated = true;
        renderLogin();

        expect(mocks.navigate).toHaveBeenCalledWith('/dashboard');
    });

    it('clears the auth error when it unmounts', () => {
        const { unmount } = renderLogin();

        unmount();

        expect(setAuthError).toHaveBeenCalledWith(null);
        expect(mocks.dispatch).toHaveBeenCalledWith({ type: 'auth/setAuthError', payload: null });
    });
});
