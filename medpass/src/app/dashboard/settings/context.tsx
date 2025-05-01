"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

// Interfaces for type definitions
interface StudentInfo {
    StudentID?: number;
    LastName: string;
    FirstName: string;
    CumGPA?: number;
    BcpmGPA?: number;
    MMICalc?: number;
    RosterYear?: number;
    GraduationYear?: number;
    Graduated?: boolean;
    GraduationLength?: number;
    Status?: string;
    Email: string;
    username?: string;
}

interface UserUpdateRequest {
    username?: string;
    email?: string;
    password?: string;
    firstname?: string;
    lastname?: string;
    position?: string;
    bio?: string;
}

interface UserUpdateResponse {
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    position: string | null;
    is_student: boolean;
    is_faculty: boolean;
    message: string;
}

interface FormData {
    firstname: string;
    lastname: string;
    email: string;
    password: string;
    username: string;
    bio: string;
}

// Define the shape of our context
interface SettingsContextType {
    theme: string;
    setTheme: React.Dispatch<React.SetStateAction<string>>;
    toggleTheme: () => void;
    getThemeClass: (darkClass: string, lightClass: string) => string;
    loading: boolean;
    error: string | null;
    updateSuccess: string | null;
    isSubmitting: boolean;
    studentInfo: StudentInfo | null;
    formData: FormData;
    handleUpdate: (field: string, value: string) => void;
    handleSubmit: (e: React.FormEvent) => void;
    confirmUpdate: () => Promise<void>;
    showConfirmation: boolean;
    setShowConfirmation: React.Dispatch<React.SetStateAction<boolean>>;
    pendingChanges: UserUpdateRequest | null;
    getChangesSummary: () => string[] | null;
}

// Create context with undefined default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Custom hook with type safety
export const useSettings = (): SettingsContextType => {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

interface SettingsProviderProps {
    children: React.ReactNode;
    session: any;
    apiBase: string;
}

export const SettingsProvider: React.FC<SettingsProviderProps> = ({
    children,
    session,
    apiBase
}) => {
    // Theme management
    const [theme, setTheme] = useState<string>('dark');

    // Theme utility function for dynamic class assignment
    const getThemeClass = (darkClass: string, lightClass: string): string => {
        return theme === 'dark' ? darkClass : lightClass;
    };

    // Apply theme to body element
    useEffect(() => {
        document.body.className = theme === 'light' ? 'bg-white' : 'bg-gray-900';
    }, [theme]);

    // Theme toggle function
    const toggleTheme = (): void => {
        setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
    };

    // UI state management
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

    // Data state management
    const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
    const [pendingChanges, setPendingChanges] = useState<UserUpdateRequest | null>(null);
    const [formData, setFormData] = useState<FormData>({
        firstname: '',
        lastname: '',
        email: '',
        password: '',
        username: '',
        bio: ''
    });

    // Form handlers
    const handleUpdate = (field: string, value: string): void => {
        setFormData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();

        // compares form to initial call & creates payload with only changed fields
        const payload: UserUpdateRequest = {};

        if (formData.firstname && formData.firstname !== studentInfo?.FirstName)
            payload.firstname = formData.firstname;

        if (formData.lastname && formData.lastname !== studentInfo?.LastName)
            payload.lastname = formData.lastname;

        if (formData.email && formData.email !== studentInfo?.Email)
            payload.email = formData.email;

        if (formData.username) payload.username = formData.username;
        if (formData.password) payload.password = formData.password;

        // Add bio for demo purposes
        if (formData.bio && formData.bio.trim() !== '')
            payload.bio = formData.bio;

        // if no changes, show message and return
        if (Object.keys(payload).length === 0) {
            setUpdateSuccess("No changes to update");
            return;
        }

        // stores the pending changes and show confirmation dialog
        setPendingChanges(payload);
        setShowConfirmation(true);
    };

    const confirmUpdate = async (): Promise<void> => {
        if (!pendingChanges) return;

        try {
            setIsSubmitting(true);
            setError(null);
            setUpdateSuccess(null);

            const response = await fetch(`${apiBase}/settings/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session?.accessToken}`,
                },
                body: JSON.stringify(pendingChanges),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || `Error: ${response.status}`);
            }

            const data: UserUpdateResponse = await response.json();

            setUpdateSuccess(data.message);

            // updates the student info with the new data
            if (studentInfo) {
                setStudentInfo({
                    ...studentInfo,
                    FirstName: data.firstname || studentInfo.FirstName,
                    LastName: data.lastname || studentInfo.LastName,
                    Email: data.email || studentInfo.Email,
                });
            }

            // clears password field after successful update
            setFormData(prev => ({
                ...prev,
                password: '',
            }));

        } catch (error) {
            console.error("Error updating profile:", error);
            setError(error instanceof Error ? error.message : "Failed to update profile");
        } finally {
            setIsSubmitting(false);
            setPendingChanges(null);
            setShowConfirmation(false);
        }
    };

    // Utility functions
    const getChangesSummary = (): string[] | null => {
        if (!pendingChanges) return null;

        const changes: string[] = [];

        if (pendingChanges.firstname && studentInfo)
            changes.push(`First name: "${studentInfo.FirstName || ''}" → "${pendingChanges.firstname}"`);

        if (pendingChanges.lastname && studentInfo)
            changes.push(`Last name: "${studentInfo.LastName || ''}" → "${pendingChanges.lastname}"`);

        if (pendingChanges.email && studentInfo)
            changes.push(`Email: "${studentInfo.Email || ''}" → "${pendingChanges.email}"`);

        if (pendingChanges.username)
            changes.push(`Username: Will be updated to "${pendingChanges.username}"`);

        if (pendingChanges.password)
            changes.push(`Password: Will be changed`);

        // Add bio changes
        if (pendingChanges.bio) {
            // Truncate bio if it's too long for display in the alert
            const displayBio = pendingChanges.bio.length > 50
                ? pendingChanges.bio.substring(0, 47) + '...'
                : pendingChanges.bio;

            changes.push(`Bio: Will be updated with "${displayBio}"`);
        }

        return changes.length > 0 ? changes : ["No changes detected"];
    };

    // Data fetching
    useEffect(() => {
        const fetchStudentInfo = async (): Promise<void> => {
            try {
                setLoading(true);
                const response = await fetch(`${apiBase}/student/info`, {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                const data: StudentInfo = await response.json();
                console.log("Student Info:", data);

                setStudentInfo(data);

                //fetch bio info AFTER student info call
                //didn't want to change the original /student/info in case it broke something else
                //shit coder LOL
                const bioResponse = await fetch(`${apiBase}/settings/bio`, {
                    headers: {
                        Authorization: `Bearer ${session?.accessToken}`,
                    },
                });

                let bioData = { bio: '' };
                if (bioResponse.ok) {
                    bioData = await bioResponse.json();
                    console.log("Bio Info:", bioData);
                }


                //populating form with initial studentInfo data
                if (data) {
                    setFormData(prev => ({
                        ...prev,
                        firstname: data.FirstName || '',
                        lastname: data.LastName || '',
                        email: data.Email || '',
                        username: data.username || '',
                        bio: bioData.bio || '',
                    }));
                }
                setError(null);
            } catch (error) {
                console.error("Error fetching student info:", error);
                setError("Failed to load student information");
            } finally {
                setLoading(false);
            }
        };

        if (session?.accessToken) {
            fetchStudentInfo();
        }
    }, [session, apiBase]);

    return (
        <SettingsContext.Provider value={{
            theme, setTheme, toggleTheme, getThemeClass,
            loading, error, updateSuccess, isSubmitting,
            studentInfo, formData, handleUpdate,
            handleSubmit, confirmUpdate,
            showConfirmation, setShowConfirmation,
            pendingChanges, getChangesSummary
        }}>
            {children}
        </SettingsContext.Provider>
    );
};