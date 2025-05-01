"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EditableText from '@/components/settings/EditableText';
import { useSettings } from "@/app/dashboard/settings/context";

const SecuritySection: React.FC = () => {
    const {
        getThemeClass,
        formData,
        handleUpdate,
        handleSubmit,
        error,
        updateSuccess,
        isSubmitting
    } = useSettings();

    return (
        <Card className={getThemeClass('bg-gray-800 border-gray-700', 'bg-white border-gray-200')}>
            <CardHeader>
                <CardTitle className={`text-3xl ${getThemeClass('text-gray-100', 'text-gray-900')} font-bold`}>
                    Security Settings
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Status messages */}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded">
                            {error}
                        </div>
                    )}
                    {updateSuccess && (
                        <div className="bg-green-900/50 border border-green-700 text-green-200 px-4 py-3 rounded">
                            {updateSuccess}
                        </div>
                    )}

                    {/* Username Section */}
                    <div className="space-y-2">
                        <Label htmlFor="username" className="text-lg text-gray-400 font-semibold">Username</Label>
                        <EditableText
                            defaultValue={formData.username || ""}
                            onUpdate={(value) => handleUpdate('username', value)}
                            placeholder="Enter your username"
                        />
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>
                            Your username is used to log into the system.
                        </p>
                    </div>

                    {/* Password Section - Keeping as regular input for security */}
                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-lg text-gray-400 font-semibold">Password</Label>
                        <div className={`${getThemeClass('bg-gray-900 border-gray-700', 'bg-gray-50 border-gray-300')} rounded-sm px-3 py-2 border`}>
                            <input
                                id="password"
                                type="password"
                                value={formData.password || ""}
                                onChange={(e) => handleUpdate('password', e.target.value)}
                                placeholder="Enter new password (leave blank to keep current)"
                                className={`w-full bg-transparent border-none focus:outline-none ${getThemeClass('text-gray-100', 'text-gray-900')}`}
                                autoComplete="new-password"
                            />
                        </div>
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>
                            Use a strong password that includes numbers, letters, and special characters.
                        </p>
                    </div>

                    <Separator className={getThemeClass('bg-gray-700', 'bg-gray-200')} />

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className={getThemeClass(
                                'bg-gray-700 hover:bg-gray-600 text-gray-100',
                                'bg-blue-600 hover:bg-blue-700 text-white'
                            )}
                        >
                            {isSubmitting ? "Updating..." : "Update Security Settings"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default SecuritySection;