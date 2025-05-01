"use client";

import React from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle
} from "@/components/ui/AlertDialog";
import { useSettings } from "@/app/dashboard/settings/context";

const ConfirmationDialog: React.FC = () => {
    const {
        getThemeClass,
        showConfirmation,
        setShowConfirmation,
        getChangesSummary,
        confirmUpdate,
        isSubmitting
    } = useSettings();

    return (
        <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
            <AlertDialogContent className={getThemeClass(
                'bg-gray-800 border border-gray-700 text-gray-100',
                'bg-white border border-gray-300 text-gray-800'
            )}>
                <AlertDialogHeader>
                    <AlertDialogTitle className={`text-lg font-semibold ${getThemeClass('text-gray-100', 'text-gray-900')}`}>
                        Confirm Profile Update
                    </AlertDialogTitle>
                    <AlertDialogDescription className={getThemeClass('text-gray-300', 'text-gray-600')}>
                        Are you sure you want to update your profile with these changes?
                    </AlertDialogDescription>

                    <div className={`mt-4 p-3 ${getThemeClass(
                        'bg-gray-900 rounded border border-gray-700 text-gray-200',
                        'bg-gray-50 rounded border border-gray-300 text-gray-700'
                    )}`}>
                        <ul className="list-disc pl-5 space-y-1">
                            {getChangesSummary()?.map((change, index) => (
                                <li key={index}>{change}</li>
                            ))}
                        </ul>
                    </div>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className={getThemeClass(
                        'bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600',
                        'bg-gray-200 hover:bg-gray-300 text-gray-800 border-gray-300'
                    )}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={confirmUpdate}
                        disabled={isSubmitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {isSubmitting ? "Updating..." : "Confirm Update"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default ConfirmationDialog;