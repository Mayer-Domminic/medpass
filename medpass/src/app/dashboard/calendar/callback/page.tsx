"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";

export default function CalendarCallbackPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      if (status !== "authenticated" || !session?.accessToken) return;

      // Get the authorization code from URL
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get("code");
      
      if (!code) {
        setError("No authorization code received from Google");
        setLoading(false);
        return;
      }

      try {
        // Get student ID
        const studentResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/report`, {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        });

        if (!studentResponse.ok) {
          throw new Error("Failed to get student information");
        }

        const studentData = await studentResponse.json();
        const studentId = studentData.StudentInfo.StudentID;

        // Exchange code for token
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/calendar/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.accessToken}`,
          },
          body: JSON.stringify({
            code,
            student_id: studentId,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Failed to exchange token");
        }

        setSuccess(true);
      } catch (error) {
        console.error("Error in callback:", error);
        setError(error instanceof Error ? error.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [session, status, router]);

  const navigateToCalendar = () => {
    router.push("/calendar");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-full max-w-md bg-gray-700 border border-gray-600 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-semibold text-white">
            {loading ? "Connecting Calendar..." : success ? "Calendar Connected!" : "Connection Failed"}
          </CardTitle>
          <CardDescription className="text-gray-300">
            {loading
              ? "Please wait while we connect your Google Calendar"
              : success
              ? "Your Google Calendar has been successfully connected"
              : "There was a problem connecting your Google Calendar"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
              <p className="mt-4 text-gray-300">Processing your request...</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle className="h-12 w-12 text-green-500" />
              <p className="mt-4 text-gray-300">
                You can now view your calendar and receive study recommendations
              </p>
              <Button onClick={navigateToCalendar} className="mt-6">
                Go to Calendar
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex justify-center">
                <Button onClick={navigateToCalendar} variant="outline">
                  Back to Calendar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}