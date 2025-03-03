"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/calendar/calendar";
import { CalendarSkeleton } from "@/components/calendar/calendar-skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Calendar as CalendarIcon, Link } from "lucide-react";

export default function CalendarPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  const [calendarConnected, setCalendarConnected] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.issuperuser) {
      redirect("/admin");
    }

    // Check if calendar is connected
    const checkCalendarConnection = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/calendar/events`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });

        if (response.ok) {
          setCalendarConnected(true);
        } else {
          const data = await response.json();
          if (data.detail && data.detail.includes("Calendar not connected")) {
            setCalendarConnected(false);
          } else {
            setError(data.detail || "Failed to check calendar connection");
          }
        }
      } catch (error) {
        console.error("Error checking calendar connection:", error);
        setError("Failed to check calendar connection");
      } finally {
        setLoading(false);
      }
    };

    if (session?.accessToken) {
      checkCalendarConnection();
    }
  }, [session]);

  const handleConnectCalendar = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/calendar/auth`, {
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect to Google's auth page
        window.location.href = data.auth_url;
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to connect calendar");
      }
    } catch (error) {
      console.error("Error connecting calendar:", error);
      setError("Failed to connect calendar");
    }
  };

  const handleDisconnectCalendar = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/calendar/disconnect`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session?.accessToken}`,
        },
      });

      if (response.ok) {
        setCalendarConnected(false);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || "Failed to disconnect calendar");
      }
    } catch (error) {
      console.error("Error disconnecting calendar:", error);
      setError("Failed to disconnect calendar");
    }
  };

  if (status === "loading" || loading) {
    return <CalendarSkeleton />;
  }

  return (
    <div className="container mx-auto py-6 max-w-7xl">
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          
          {calendarConnected === false && (
            <Button onClick={handleConnectCalendar} className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Connect Google Calendar
            </Button>
          )}
          
          {calendarConnected === true && (
            <Button 
              onClick={handleDisconnectCalendar} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <Link className="h-4 w-4" />
              Disconnect Calendar
            </Button>
          )}
        </div>
        
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {calendarConnected === false && !error ? (
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Calendar</CardTitle>
              <CardDescription>
                Connect your Google Calendar to view your schedule and get study recommendations.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={handleConnectCalendar} className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                Connect Google Calendar
              </Button>
            </CardContent>
          </Card>
        ) : calendarConnected === true ? (
          <Calendar />
        ) : null}
      </div>
    </div>
  );
}