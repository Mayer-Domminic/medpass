"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import EditableText from '@/components/settings/EditableText';
import { useSettings } from "@/app/dashboard/settings/context";

const ProfileSection: React.FC = () => {
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
                    User Profile
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

                    {/* Name Section */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstname" className="text-lg text-gray-400 font-semibold">First Name</Label>
                                <EditableText
                                    defaultValue={formData.firstname || ""}
                                    onUpdate={(value) => handleUpdate('firstname', value)}
                                    placeholder="Enter your first name"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastname" className="text-lg text-gray-400 font-semibold">Last name</Label>
                                <EditableText
                                    defaultValue={formData.lastname || ""}
                                    onUpdate={(value) => handleUpdate('lastname', value)}
                                    placeholder="Enter your last name"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bio Section*/}
                    <div className="space-y-2">
                        <Label htmlFor="bio" className="text-lg text-gray-400 font-semibold">Bio</Label>
                        <div className={`${getThemeClass('bg-gray-900 border-gray-700', 'bg-gray-50 border-gray-300')} rounded-sm px-3 py-2 border`}>
                            <textarea
                                id="bio"
                                placeholder="Tell us about yourself in a few words!"
                                className={`w-full bg-transparent border-none focus:outline-none ${getThemeClass('text-gray-100 placeholder:text-gray-400', 'text-gray-900 placeholder:text-gray-500')} h-32 resize-y`}
                                autoComplete="off"
                                value={formData.bio || ""}
                                onChange={(e) => handleUpdate('bio', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Email Section */}
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-lg text-gray-400 font-semibold">Email address</Label>
                        <EditableText
                            defaultValue={formData.email || ""}
                            onUpdate={(value) => handleUpdate('email', value)}
                            placeholder="Enter your email address"
                        />
                        <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>
                            This field changes your email address
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
                            {isSubmitting ? "Updating..." : "Update Profile"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

export default ProfileSection;