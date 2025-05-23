import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAppSelector } from '../../../store/hooks';

interface LayoutProps {
    hideNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ hideNavbar = false }) => {
    const { showNavbar } = useAppSelector(state => state.ui);

    // Only show navbar if not explicitly hidden by props AND showNavbar is true in Redux
    const displayNavbar = !hideNavbar && showNavbar;

    return (
        <div className="min-h-screen flex flex-col">
            {displayNavbar && <Navbar />}
            <main className={`flex-1 ${!displayNavbar ? 'pt-0' : ''}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;