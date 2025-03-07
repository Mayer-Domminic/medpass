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
// {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, } from "@/components/ui/alert-dialog";

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

const SettingsNavItem = ({ 
  icon, 
  label, 
  active = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  label: string; 
  active?: boolean;
  onClick: () => void;
}) => (
  <Button 
    variant="ghost" 
    className={`w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 ${active ? 'bg-gray-800 text-gray-100' : ''}`}
    onClick={onClick}
  >
    {icon}
    <span className="ml-2">{label}</span>
  </Button>
);

export default function SettingsPage() {
  
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  // state variables
  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<UserUpdateRequest | null>(null);
  const [activeSection, setActiveSection] = useState<SettingSection>('profile');
  const [formData, setFormData] = useState<UserUpdateRequest>({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    username: '',
  });

  useEffect(() => {
    if (session?.user?.issuperuser) {
      console.log("ADMIN")
      redirect("/admin");
    }

    const fetchStudentInfo = async () => {
      try {
        setLoading(true);

        const API_URL =
            typeof window === "undefined"
              ? "http://backend:8000"
              : "http://localhost:8000";
          const response = await fetch(`${API_URL}/api/v1/report`, {
            headers: {
              Authorization: `Bearer ${session?.accessToken}`,
            },
          });

          if (!response.ok) {
            throw new Error(`Error: ${response.status}`);
          }

        const data = await response.json();
        console.log("Student Info:", data);
        setStudentInfo(data.StudentInfo);
        
        //populating form with initial studentInfo data
        if (data.StudentInfo) {
          setFormData(prev => ({
            ...prev,
            firstname: data.StudentInfo.FirstName || '',
            lastname: data.StudentInfo.LastName || '',
            email: data.StudentInfo.Email || '',
            username: data.StudentInfo.username || '',
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
  }, [session]);

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

      const API_URL =
        typeof window === "undefined"
          ? "http://backend:8000"
          : "http://localhost:8000";
      
      const response = await fetch(`${API_URL}/api/v1/settings/update`, {
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

  // collects list of changes to be displayed in confirmation dialog
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
    
    return changes.length > 0 ? changes : ["No changes detected"];
  };

  // renders activeSection
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-3xl text-gray-100 font-bold">User Profile</CardTitle>
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
                      className="border-gray-700 hover:bg-gray-700"
                    >
                      Change picture
                    </Button>
                    <p className="text-sm text-gray-400">
                      An avatar helps personalize your account.
                    </p>
                  </div>
                </div>

                <Separator className="bg-gray-700" />

                {/* Name Section */}
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstname" className="text-gray-400 font-semibold">First Name</Label>
                      <EditableText 
                        defaultValue={formData.firstname || ""}
                        onUpdate={(value) => handleUpdate('firstname', value)}
                        placeholder={studentInfo?.FirstName || "Enter your first name"}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastname" className="text-gray-400 font-semibold">Last name</Label>
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
                  <Label htmlFor="bio" className="text-gray-400 font-semibold">Bio</Label>
                  <div className="bg-gray-900 border border-gray-700 rounded-sm px-3 py-2">
                    <textarea
                      id="bio"
                      placeholder="Tell us about yourself in a few words!"
                      className="w-full bg-transparent border-none focus:outline-none text-gray-100 placeholder:text-gray-400 h-32 resize-y"
                      autoComplete="off"
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    This will be displayed on your public profile.
                  </p>
                </div>

                 {/*TODO: Add autofill once logininfo route is implemented */}
                {/* Email Section */} 
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-400 font-semibold">Email address</Label>
                  <EditableText 
                    defaultValue={formData.email || ""}
                    onUpdate={(value) => handleUpdate('email', value)}
                    placeholder={studentInfo?.Email || "Enter your email address"}
                  />
                  <p className="text-sm text-gray-400">
                    This email will be used for account-related notifications
                  </p>
                </div>
                
                {/* Note: Username and password fields have been moved to the Security tab */}

                <Separator className="bg-gray-700" />

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-100"
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-3xl text-gray-100 font-bold">Security Settings</CardTitle>
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
                  <Label htmlFor="username" className="text-gray-400 font-semibold">Username</Label>
                  <EditableText 
                    defaultValue={formData.username || ""}
                    onUpdate={(value) => handleUpdate('username', value)}
                    placeholder="Enter your username"
                  />
                  <p className="text-sm text-gray-400">
                    Your username is used to log into the system.
                  </p>
                </div>
                
                {/* Password Section - Keeping as regular input for security */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-400 font-semibold">Password</Label>
                  <div className="bg-gray-900 border border-gray-700 rounded-sm px-3 py-2">
                    <input 
                      id="password" 
                      type="password" 
                      value={formData.password || ""}
                      onChange={(e) => handleUpdate('password', e.target.value)}
                      placeholder="Enter new password (leave blank to keep current)" 
                      className="w-full bg-transparent border-none focus:outline-none text-gray-100"
                      autoComplete="new-password"
                    />
                  </div>
                  <p className="text-sm text-gray-400">
                    Use a strong password that includes numbers, letters, and special characters.
                  </p>
                </div>
                
                {/* Save Button */}
                <div className="flex justify-end">
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-100"
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
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-3xl text-gray-100 font-bold">User Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 text-gray-200">
                <div className="bg-gray-900/50 border border-gray-700 p-4 rounded-md">
                  <p className="text-gray-300">This feature is currently under development and will be available soon.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      
      default:
        return null;
    }
  };

  if (status === "loading" || loading) {
    return <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }
 
  return (
    <div className="min-h-screen bg-gray-900">
      <Sidebar />
      
      {/* Main Content*/}
      <div className="pl-[72px]">
        <div className="container mx-auto py-6 text-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold ">Settings</h1>
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
            </div>

            {/* Main Settings Content */}
            <div className="col-span-9">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog 
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent className="bg-gray-800 border border-gray-700 text-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-gray-100">Confirm Profile Update</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-300">
              Are you sure you want to update your profile with these changes?
            </AlertDialogDescription>
            
            <div className="mt-4 p-3 bg-gray-900 rounded border border-gray-700 text-gray-200">
              <ul className="list-disc pl-5 space-y-1">
                {getChangesSummary()?.map((change, index) => (
                  <li key={index}>{change}</li>
                ))}
              </ul>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-700 hover:bg-gray-600 text-gray-100 border-gray-600">
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
      </AlertDialog>*/}
    </div>
  );
}