'use client';

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
export const dynamic = 'force-dynamic';
import Sidebar from '@/components/navbar';
import { SettingsProvider, useSettings } from '@/app/dashboard/settings/context';
import SettingsNav from '@/components/settings/SettingsNav';
import ProfileSection from '@/components/settings/ProfileSection';
import SecuritySection from "@/components/settings/SecuritySection";
import PreferencesSection from "@/components/settings/PreferencesSection";
import ConfirmationDialog from '@/components/settings/ConfirmationDialog';

// Define the type for the section
type SettingSection = 'profile' | 'security' | 'preferences';

// Main settings page layout component that uses context
const SettingsPageContent: React.FC = () => {
    const [activeSection, setActiveSection] = useState<SettingSection>('profile');
    const { getThemeClass, loading } = useSettings();

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
    }

    return (
        <div className={getThemeClass('min-h-screen bg-gray-900', 'min-h-screen bg-gray-50')}>
            <div className="pl-[72px]">
                <div className={`container mx-auto py-6 ${getThemeClass('text-gray-100', 'text-gray-900')}`}>
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold">Settings</h1>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                        <div className="col-span-3">
                            <SettingsNav
                                activeSection={activeSection}
                                setActiveSection={setActiveSection}
                            />
                        </div>

                        <div className="col-span-9">
                            {activeSection === 'profile' && <ProfileSection />}
                            {activeSection === 'security' && <SecuritySection />}
                            {activeSection === 'preferences' && <PreferencesSection />}
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmationDialog />
        </div>
    );
};

// Main content container with authentication
export default function SettingsContent() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/auth/login");
        },
    });

    const apiBase = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

    // Redirect admins
    useEffect(() => {
        if (session?.user?.issuperuser) {
            redirect("/admin");
        }
    }, [session]);

    // Show loading state while session is loading
    if (status === "loading") {
        return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
    }

    return (
        <>
            <Sidebar />

            {/* Wrap everything in the context provider */}
            <SettingsProvider session={session} apiBase={apiBase}>
                <SettingsPageContent />
            </SettingsProvider>
        </>
    );
}