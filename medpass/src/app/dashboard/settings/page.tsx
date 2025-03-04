"use client";

import React from 'react';
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
export const dynamic = 'force-dynamic';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Sidebar from '@/components/navbar';
   

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
}

const SettingsNavItem = ({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) => (
  <Button 
    variant="ghost" 
    className={`w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-gray-100 ${active ? 'bg-gray-800 text-gray-100' : ''}`}
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

  const [studentInfo, setStudentInfo] = useState<StudentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
                  active
                />
                <SettingsNavItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>}
                  label="Account"
                />
                <SettingsNavItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>}
                  label="Security"
                />
                <SettingsNavItem
                  icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>}
                  label="Preferences"
                />
              </div>
            </div>

            {/* Main Settings Content */}
            <div className="col-span-9">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className=" text-3xl text-gray-100 font-bold">User Profile</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Settings Picture Section */}
                    <div className="flex items-start space-x-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src="/api/placeholder/96/96" alt="Settings picture" />
                        <AvatarFallback>UN</AvatarFallback>
                      </Avatar>
                      <div className="space-y-2">
                        <Button variant="outline" className="border-gray-700 hover:bg-gray-700">
                          Change picture
                        </Button>
                        <p className="text-sm text-gray-400">
                          An avatar helps personalize your account
                        </p>
                      </div>
                    </div>

                    <Separator className="bg-gray-700" />

                    {/* Name Section */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName" className="text-gray-300 font-semibold">First Name</Label>
                          <Input 
                            id="firstName" 
                            placeholder={studentInfo?.FirstName || ""}
                            className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:ring-gray-700 focus:border-gray-600"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName" className="text-gray-300 font-semibold">Last name</Label>
                          <Input 
                            id="lastName" 
                            placeholder="Enter your last name" 
                            className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:ring-gray-700 focus:border-gray-600"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Bio Section */}
                    <div className="space-y-2">
                      <Label htmlFor="bio" className="text-gray-300 font-semibold">Bio</Label>
                      <Textarea
                        id="bio"
                        placeholder="Tell us about yourself in a few words!"
                        className="h-32 bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:ring-gray-700 focus:border-gray-600"
                      />
                      <p className="text-sm text-gray-400">
                        This will be displayed on your public profile
                      </p>
                    </div>

                    {/* Email Section */}
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300 font-semibold">Email address</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="Enter your email" 
                        className="bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:ring-gray-700 focus:border-gray-600"
                      />
                      <p className="text-sm text-gray-400">
                        This email will be used for account-related notifications
                      </p>
                    </div>

                    <Separator className="bg-gray-700" />

                    {/* Save Button */}
                    <div className="flex justify-end">
                      <Button className="bg-gray-700 hover:bg-gray-600 text-gray-100">
                        Update Settings
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};