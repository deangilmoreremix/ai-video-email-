import React, { useState, useEffect } from 'react';
import { VideoIcon } from './icons';
import { useAuth } from '../contexts/AuthContext';
import { checkIsSuperAdmin } from '../services/adminService';

interface HeaderProps {
    onNewProject: () => void;
    onOpenSettings: () => void;
    onOpenVideoLibrary: () => void;
    onOpenAuth: () => void;
    onOpenAdmin?: () => void;
    onOpenCampaigns?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onNewProject, onOpenSettings, onOpenVideoLibrary, onOpenAuth, onOpenAdmin, onOpenCampaigns }) => {
    const { user, signOut } = useAuth();
    const [scrolled, setScrolled] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const checkAdmin = async () => {
            if (user) {
                const adminStatus = await checkIsSuperAdmin();
                setIsAdmin(adminStatus);
            } else {
                setIsAdmin(false);
            }
        };
        checkAdmin();
    }, [user]);

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
            scrolled
                ? 'py-3 bg-gray-900/95 backdrop-blur-xl border-b border-gray-800 shadow-2xl'
                : 'py-6 bg-transparent'
        }`}>
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 rounded-full blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300"></div>
                            <div className={`relative bg-gradient-to-br from-blue-600 to-green-600 p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 ${
                                scrolled ? 'w-10 h-10' : 'w-12 h-12'
                            }`}>
                                <VideoIcon className="w-full h-full text-white" />
                            </div>
                        </div>
                        <div className="transition-all duration-300">
                            <h1 className={`font-bold bg-gradient-to-r from-blue-400 via-green-400 to-blue-400 bg-clip-text text-transparent transition-all duration-300 animate-gradient bg-[length:200%_auto] ${
                                scrolled ? 'text-xl' : 'text-3xl'
                            }`}>
                                AI Video Assistant
                            </h1>
                            {!scrolled && (
                                <p className="text-xs text-gray-400 animate-fadeIn">Powered by Google Gemini & Veo 2</p>
                            )}
                        </div>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-3">
                        {user ? (
                            <>
                                <NavButton
                                    onClick={onOpenVideoLibrary}
                                    icon="📚"
                                    label="My Videos"
                                    variant="secondary"
                                />
                                {onOpenCampaigns && (
                                    <NavButton
                                        onClick={onOpenCampaigns}
                                        icon="🚀"
                                        label="Campaigns"
                                        variant="secondary"
                                    />
                                )}
                                <NavButton
                                    onClick={onNewProject}
                                    icon="✨"
                                    label="New Project"
                                    variant="primary"
                                />
                                <NavButton
                                    onClick={onOpenSettings}
                                    icon="⚙️"
                                    label="Settings"
                                    variant="secondary"
                                />
                                {isAdmin && onOpenAdmin && (
                                    <NavButton
                                        onClick={onOpenAdmin}
                                        icon="🔐"
                                        label="Admin"
                                        variant="admin"
                                    />
                                )}
                                <button
                                    onClick={signOut}
                                    className="px-4 py-2 text-sm bg-red-600/20 backdrop-blur-sm border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 hover:border-red-500/50 transition-all duration-300 hover:scale-105 active:scale-95"
                                    title="Sign out"
                                    aria-label="Sign out"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={onOpenAuth}
                                className="relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg overflow-hidden group"
                                title="Sign in or sign up"
                                aria-label="Sign in or sign up"
                            >
                                <span className="relative z-10">Get Started Free</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow"></div>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="md:hidden p-2 rounded-lg bg-gray-800/50 backdrop-blur-sm border border-gray-700 hover:bg-gray-700/50 transition-all duration-300"
                        aria-label="Toggle menu"
                    >
                        <div className="w-6 h-5 flex flex-col justify-between">
                            <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${showMenu ? 'rotate-45 translate-y-2' : ''}`}></span>
                            <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${showMenu ? 'opacity-0' : ''}`}></span>
                            <span className={`w-full h-0.5 bg-white rounded transition-all duration-300 ${showMenu ? '-rotate-45 -translate-y-2' : ''}`}></span>
                        </div>
                    </button>
                </div>

                {/* Mobile Menu */}
                <div className={`md:hidden overflow-hidden transition-all duration-500 ${
                    showMenu ? 'max-h-96 mt-4 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                    <div className="bg-gray-800/50 backdrop-blur-xl border border-gray-700 rounded-xl p-4 space-y-2">
                        {user ? (
                            <>
                                <MobileNavButton
                                    onClick={() => { onOpenVideoLibrary(); setShowMenu(false); }}
                                    icon="📚"
                                    label="My Videos"
                                />
                                <MobileNavButton
                                    onClick={() => { onNewProject(); setShowMenu(false); }}
                                    icon="✨"
                                    label="New Project"
                                />
                                <MobileNavButton
                                    onClick={() => { onOpenSettings(); setShowMenu(false); }}
                                    icon="⚙️"
                                    label="Settings"
                                />
                                {isAdmin && onOpenAdmin && (
                                    <MobileNavButton
                                        onClick={() => { onOpenAdmin(); setShowMenu(false); }}
                                        icon="🔐"
                                        label="Admin Panel"
                                    />
                                )}
                                <button
                                    onClick={() => { signOut(); setShowMenu(false); }}
                                    className="w-full px-4 py-3 text-left bg-red-600/20 border border-red-500/30 text-red-400 font-semibold rounded-lg hover:bg-red-600/30 transition-all duration-300"
                                >
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => { onOpenAuth(); setShowMenu(false); }}
                                className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white font-semibold rounded-lg hover:from-blue-500 hover:to-green-500 transition-all duration-300"
                            >
                                Get Started Free
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Animated progress bar */}
            {scrolled && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 via-green-600 to-blue-600 bg-[length:200%_auto] animate-gradient"></div>
            )}
        </header>
    );
};

const NavButton: React.FC<{
    onClick: () => void;
    icon: string;
    label: string;
    variant: 'primary' | 'secondary' | 'admin'
}> = ({ onClick, icon, label, variant }) => (
    <button
        onClick={onClick}
        className={`group relative px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 overflow-hidden ${
            variant === 'primary'
                ? 'bg-gradient-to-r from-blue-600 to-green-600 text-white'
                : variant === 'admin'
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white border border-red-500/50'
                : 'bg-gray-800/50 backdrop-blur-sm border border-gray-700 text-gray-300 hover:bg-gray-700/50 hover:border-blue-500/50'
        }`}
        title={label}
        aria-label={label}
    >
        <span className="relative z-10 flex items-center gap-2">
            <span className="transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12">{icon}</span>
            {label}
        </span>
        {variant === 'primary' && (
            <>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-green-500 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-glow"></div>
            </>
        )}
    </button>
);

const MobileNavButton: React.FC<{
    onClick: () => void;
    icon: string;
    label: string;
}> = ({ onClick, icon, label }) => (
    <button
        onClick={onClick}
        className="w-full px-4 py-3 text-left bg-gray-700/50 border border-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600/50 hover:border-blue-500/50 transition-all duration-300 flex items-center gap-3"
    >
        <span className="text-xl">{icon}</span>
        {label}
    </button>
);
