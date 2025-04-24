"use client";

import React, { useEffect } from 'react';
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import CalendarView from '@/components/calendar/calendar-view';
import Navbar from '@/components/navbar';
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export default function CalendarPage() {
  const { data: session, status, update } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  // Effect to check and refresh token if needed
  useEffect(() => {
    const checkToken = async () => {
      if (session?.accessToken) {
        // Check if token is expired or about to expire
        const tokenData = parseJwt(session.accessToken);
        if (tokenData && tokenData.exp) {
          const expiryTime = tokenData.exp * 1000; // Convert to milliseconds
          const currentTime = Date.now();
          const timeToExpiry = expiryTime - currentTime;
          
          // If token expires in less than 5 minutes, refresh it
          if (timeToExpiry < 5 * 60 * 1000) {
            console.log("Token expiring soon, refreshing...");
            await update(); // Refresh the session
          }
        }
      }
    };
    
    checkToken();
  }, [session, update]);

  // Parse JWT token to get expiry time
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error parsing JWT:", error);
      return null;
    }
  };

  // Check if loading
  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Session refresh button if needed
  const handleRefreshSession = async () => {
    await update();
    window.location.reload();
  };

  return (
    <div className="dark min-h-screen bg-background text-foreground flex">
      <Navbar />
      <div className="flex-1 ml-[72px]">
        {!session?.accessToken && (
          <div className="flex justify-center items-center p-4">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 p-4 rounded-md">
              <h3 className="font-bold mb-2">Authentication Required</h3>
              <p className="mb-4">Your session token is missing or invalid. Please refresh your session.</p>
              <Button 
                onClick={handleRefreshSession} 
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh Session
              </Button>
            </div>
          </div>
        )}
        
        <CalendarView />
      </div>
      <Toaster />
    </div>
  );
}