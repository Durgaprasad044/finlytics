"use client";

import { ThemeProvider } from '../contexts/ThemeContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ProfileProvider } from '../contexts/ProfileContext';
import { FinanceProvider } from '../contexts/FinanceContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { Toaster } from 'react-hot-toast';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ProfileProvider>
                    <FinanceProvider>
                        <NotificationProvider>
                            {children}
                            <Toaster
                                position="top-right"
                                toastOptions={{
                                    duration: 4000,
                                    className: 'dark:bg-gray-800 dark:text-white',
                                    style: {
                                        background: '#363636',
                                        color: '#fff',
                                    },
                                }}
                            />
                        </NotificationProvider>
                    </FinanceProvider>
                </ProfileProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}
