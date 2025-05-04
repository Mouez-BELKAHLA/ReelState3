import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

interface LayoutProps {
    hideNavbar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ hideNavbar = false }) => {
    return (
        <div className="min-h-screen flex flex-col">
            {!hideNavbar && <Navbar />}
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;