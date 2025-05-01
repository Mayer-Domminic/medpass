"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSettings } from "@/app/dashboard/settings/context";

const PreferencesSection: React.FC = () => {
    const { getThemeClass, theme, toggleTheme } = useSettings();

    return (
        <Card className={getThemeClass('bg-gray-800 border-gray-700', 'bg-white border-gray-200')}>
            <CardHeader>
                <CardTitle className={`text-3xl ${getThemeClass('text-gray-100', 'text-gray-900')} font-bold`}>
                    Accessibility Preferences
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className={`space-y-6 ${getThemeClass('text-gray-200', 'text-gray-700')}`}>

                    {/* Light Mode Toggle */}
                    <div className="mb-6">
                        <h3 className="text-lg text-gray-400 font-semibold">Display Mode</h3>
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')} mb-4`}>
                            Switch between dark and light mode
                        </p>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <svg
                                    className={`w-5 h-5 ${getThemeClass('text-gray-400', 'text-gray-600')}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                                    />
                                </svg>
                                <span>Dark</span>
                            </div>

                            <div
                                className={`relative inline-flex h-6 w-11 items-center rounded-full 
                  ${getThemeClass('bg-gray-700', 'bg-blue-300')} 
                  transition-colors hover:${getThemeClass('bg-gray-600', 'bg-blue-400')} cursor-pointer`}
                                onClick={toggleTheme}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white 
                    transition-transform duration-200 ease-in-out 
                    ${theme === 'dark' ? 'ml-1' : 'translate-x-6'}`}
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <span>Light</span>
                                <svg
                                    className={`w-5 h-5 ${getThemeClass('text-gray-400', 'text-gray-600')}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <Separator className={getThemeClass('bg-gray-700', 'bg-gray-200')} />

                    {/* Text Size Section */}
                    <div>
                        <h3 className="text-lg text-gray-400 font-semibold">Text Size</h3>
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')} mb-4`}>
                            Adjust the size of text throughout the application
                        </p>
                        <div className="flex items-center space-x-2">
                            <span className="text-xs">A</span>
                            <input
                                type="range"
                                min="50"
                                max="150"
                                defaultValue="100"
                                className={`w-full h-2 ${getThemeClass('bg-gray-700', 'bg-gray-200')} rounded-lg appearance-none cursor-pointer`}
                            />
                            <span className="text-lg">A</span>
                        </div>
                        <div className={`mt-2 text-right text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>100%</div>
                    </div>

                    <Separator className={getThemeClass('bg-gray-700', 'bg-gray-200')} />

                    {/* Contrast Section */}
                    <div>
                        <h3 className="text-lg text-gray-400 font-semibold">Contrast</h3>
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')} mb-4`}>
                            Increase contrast for better readability
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                            <Button
                                variant="outline"
                                className={getThemeClass(
                                    'bg-gray-900 hover:bg-gray-800 text-gray-300 border-gray-700 hover:border-gray-600',
                                    'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400'
                                )}
                            >
                                Normal
                            </Button>
                            <Button
                                variant="outline"
                                className={getThemeClass(
                                    'bg-gray-900 hover:bg-gray-800 text-gray-100 border-gray-700 hover:border-gray-600',
                                    'bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-300 hover:border-gray-400'
                                )}
                            >
                                Medium
                            </Button>
                            <Button
                                variant="outline"
                                className={getThemeClass(
                                    'bg-gray-900 hover:bg-gray-800 text-white border-gray-700 hover:border-gray-600',
                                    'bg-gray-200 hover:bg-gray-300 text-gray-900 border-gray-400 hover:border-gray-500'
                                )}
                            >
                                High
                            </Button>
                            <Button
                                variant="outline"
                                className={getThemeClass(
                                    'bg-black hover:bg-gray-900 text-white border-gray-700 hover:border-gray-600',
                                    'bg-gray-700 hover:bg-gray-800 text-white border-gray-500 hover:border-gray-600'
                                )}
                            >
                                Maximum
                            </Button>
                        </div>
                    </div>

                    <Separator className={getThemeClass('bg-gray-700', 'bg-gray-200')} />

                    {/* Motion Section */}
                    <div>
                        <h3 className="text-lg text-gray-400 font-semibold">Motion & Animations</h3>
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')} mb-4`}>
                            Reduce motion for fewer distractions
                        </p>
                        <div className="flex items-center justify-between">
                            <span>Reduce animations</span>
                            <div className={`relative inline-flex h-6 w-11 items-center rounded-full ${getThemeClass('bg-gray-700', 'bg-gray-300')} transition-colors hover:${getThemeClass('bg-gray-600', 'bg-gray-400')} cursor-pointer`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full ${getThemeClass('bg-gray-100', 'bg-white')} transition-transform ml-1`} />
                            </div>
                        </div>
                    </div>

                    <Separator className={getThemeClass('bg-gray-700', 'bg-gray-200')} />

                    {/* Screen Reader Support */}
                    <div>
                        <h3 className="text-lg text-gray-400 font-semibold">Screen Reader Support</h3>
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-600')} mb-4`}>
                            Optimize interface for screen readers
                        </p>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span>Enhanced descriptions</span>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors cursor-pointer">
                                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Announce page changes</span>
                                <div className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600 transition-colors cursor-pointer">
                                    <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-6" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end pt-4">
                        <Button
                            type="button"
                            className={getThemeClass(
                                'bg-gray-700 hover:bg-gray-600 text-gray-100',
                                'bg-blue-600 hover:bg-blue-700 text-white'
                            )}
                        >
                            Save Preferences
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PreferencesSection;