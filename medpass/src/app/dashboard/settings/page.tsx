"use client";

import React from 'react';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
export const dynamic = 'force-dynamic';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Sidebar from '@/components/navbar';
import EditableText from '@/components/EditableText';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/AlertDialog";

const apiBase = `${process.env.NEXT_PUBLIC_API_BASE_URL}`;

// interfaces for studentInfo and user update request/response
interface StudentInfo {
  StudentID: number;
  LastName: string;
  FirstName: string;
  CumGPA: number;
  BcpmGPA: number;
  MMICalc: number;
  RosterYear: number;
  GraduationYear: number;
  Graduated: boolean;
  GraduationLength: number;
  Status: string;
  Email?: string;
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

// setting section types | determines view to render
type SettingSection = 'profile' | 'security' | 'preferences';

// Theme-aware navigation item component
const SettingsNavItem = ({ 
  icon, 
  label, 
  active = false, 
  onClick,
  theme
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick: () => void;
  theme: string;
}) => (
  <Button 
    variant="ghost" 
    className={`w-full justify-start ${
      theme === 'dark' 
        ? `text-gray-300 hover:bg-gray-800 hover:text-gray-100 ${active ? 'bg-gray-800 text-gray-100' : ''}` 
        : `text-gray-700 hover:bg-gray-200 hover:text-gray-900 ${active ? 'bg-gray-200 text-gray-900' : ''}`
    }`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </Button>
);

export default function SettingsPage() {
  // Session management
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  // Theme management
  const [theme, setTheme] = useState('dark');
  
  // Theme utility function for dynamic class assignment
  const getThemeClass = (darkClass: string, lightClass: string) => {
    return theme === 'dark' ? darkClass : lightClass;
  };
  
  // Apply theme to body element
  useEffect(() => {
    document.body.className = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  }, [theme]);
  
  // Theme toggle function
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  // UI state management
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Data state management
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [pendingChanges, setPendingChanges] = useState<UserUpdateRequest | null>(null);
  const [formData, setFormData] = useState<UserUpdateRequest>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    username: '',
    bio: ''
  });

  // Data fetching
  useEffect(() => {
    if (session?.user?.issuperuser) {
      console.log("ADMIN")
      redirect("/admin");
    }

    const fetchStudentInfo = async () => {
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
        const data = await response.json();
        console.log("Student Info:", data);

        setStudentInfo(data);

        //populating form with initial studentInfo data
        if (data) {
          setFormData(prev => ({
            ...prev,
            firstname: data.FirstName || '',
            lastname: data.LastName || '',
            email: data.Email || '',
            username: data.username || '',
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

    if (session?.accessToken && !session.user.issuperuser) {
      fetchStudentInfo();
    }
  }, [session, apiBase]);

  // Form handlers
  const handleUpdate = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
    
    // Add bio for demo purposes (just for the dialog, not actual API submission)
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

  const confirmUpdate = async () => {
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
    }
  };

  // Utility functions
  const getChangesSummary = () => {
    if (!pendingChanges) return null;
    
    const changes = [];
    
    if (pendingChanges.firstname) 
      changes.push(`First name: "${studentInfo?.FirstName || ''}" → "${pendingChanges.firstname}"`);
    
    if (pendingChanges.lastname) 
      changes.push(`Last name: "${studentInfo?.LastName || ''}" → "${pendingChanges.lastname}"`);
    
    if (pendingChanges.email) 
      changes.push(`Email: "${studentInfo?.Email || ''}" → "${pendingChanges.email}"`);
    
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

  // Render UI sections
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
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
                
                {/* Profile Picture Section */}
                <div className="flex items-start space-x-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src="/api/placeholder/96/96" alt="Profile picture" />
                    <AvatarFallback>
                      {studentInfo?.FirstName?.charAt(0) || ''}{studentInfo?.LastName?.charAt(0) || ''}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className={getThemeClass('border-gray-700 hover:bg-gray-700', 'border-gray-300 hover:bg-gray-100')}
                    >
                      Change picture
                    </Button>
                    <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>
                      An avatar helps personalize your account.
                    </p>
                  </div>
                </div>

                <Separator className={getThemeClass('bg-gray-700', 'bg-gray-200')} />

                {/* Name Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="text-lg text-gray-400 font-semibold">First Name</Label>
                      <EditableText 
                        defaultValue={formData.firstname || ""}
                        onUpdate={(value) => handleUpdate('firstname', value)}
                        placeholder={studentInfo?.FirstName || "Enter your first name"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname" className="text-lg text-gray-400 font-semibold">Last name</Label>
                      <EditableText 
                        defaultValue={formData.lastname || ""} 
                        onUpdate={(value) => handleUpdate('lastname', value)}
                        placeholder={studentInfo?.LastName || "Enter your last name"}
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
                  <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>
                    This will be displayed on your public profile.
                  </p>
                </div>

                 {/*TODO: Add autofill once logininfo route is implemented */}
                {/* Email Section */} 
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-lg text-gray-400 font-semibold">Email address</Label>
                  <EditableText 
                    defaultValue={formData.email || ""}
                    onUpdate={(value) => handleUpdate('email', value)}
                    placeholder={studentInfo?.Email || "Enter your email address"}
                  />
                  <p className={`text-sm ${getThemeClass('text-gray-400', 'text-gray-500')}`}>
                    This email will be used for account-related notifications
                  </p>
                </div>
                
                {/* Note: Username and password fields have been moved to the Security tab */}

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
      
      case 'security':
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
      
      case 'preferences':
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
      
      default:
        return null;
    }
  };

  // Loading state
  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }
 
  // Main component render
  return (
    <div className={getThemeClass('min-h-screen bg-gray-900', 'min-h-screen bg-gray-50')}>
      <Sidebar />
      
      {/* Main Content*/}
      <div className="pl-[72px]">
        <div className={`container mx-auto py-6 ${getThemeClass('text-gray-100', 'text-gray-900')}`}>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>

          <div className="grid grid-cols-12 gap-6">
            {/* Settings Sidebar */}
            <div className="col-span-3">
              <div className="space-y-1">
                <SettingsNavItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>}
                  label="Profile"
                  active={activeSection === 'profile'}
                  onClick={() => setActiveSection('profile')}
                  theme={theme}
                />

                <SettingsNavItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>}
                  label="Security"
                  active={activeSection === 'security'}
                  onClick={() => setActiveSection('security')}
                  theme={theme}
                />
                <SettingsNavItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>}
                  label="Preferences"
                  active={activeSection === 'preferences'}
                  onClick={() => setActiveSection('preferences')}
                  theme={theme}
                />
              </div>
            </div>

            {/* Main Settings Content */}
            <div className="col-span-9">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
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
    </div>
  );
}