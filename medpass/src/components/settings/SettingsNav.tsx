"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { useSettings } from "@/app/dashboard/settings/context";

// Define the type for the section
type SettingSection = 'profile' | 'security' | 'preferences';

interface SettingsNavItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick: () => void;
}

// Individual navigation item component
const SettingsNavItem: React.FC<SettingsNavItemProps> = ({
    icon,
    label,
    active = false,
    onClick
}) => {
    const { getThemeClass } = useSettings();

    return (
        <Button
            variant="ghost"
            className={`w-full justify-start ${getThemeClass(
                `text-gray-300 hover:bg-gray-800 hover:text-gray-100 ${active ? 'bg-gray-800 text-gray-100' : ''}`,
                `text-gray-700 hover:bg-gray-200 hover:text-gray-900 ${active ? 'bg-gray-200 text-gray-900' : ''}`
            )
                }`}
            onClick={onClick}
        >
            {icon}
            <span className="ml-2">{label}</span>
        </Button>
    );
};

interface SettingsNavProps {
    activeSection: SettingSection;
    setActiveSection: (section: SettingSection) => void;
}

const SettingsNav: React.FC<SettingsNavProps> = ({ activeSection, setActiveSection }) => {
    return (
        <div className="space-y-1">
            <SettingsNavItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>}
                label="Profile"
                active={activeSection === 'profile'}
                onClick={() => setActiveSection('profile')}
            />

            <SettingsNavItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>}
                label="Security"
                active={activeSection === 'security'}
                onClick={() => setActiveSection('security')}
            />

            <SettingsNavItem
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>}
                label="Preferences"
                active={activeSection === 'preferences'}
                onClick={() => setActiveSection('preferences')}
            />
        </div>
    );
};

export default SettingsNav;