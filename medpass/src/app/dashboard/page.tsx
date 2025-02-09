"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  useEffect(() => {
    const fetchStudentInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/student/info`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch student info');
        }

        const data = await response.json();
        console.log("Student Info:", data);
      } catch (error) {
        console.error("Error fetching student info:", error);
      }
    };

    if (session?.accessToken && session) {
      fetchStudentInfo();
    }
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 bg-gray-400">
      <h1 className="text-2xl font-bold ">Welcome to your Dashboard</h1>
      <p className="mt-4">You are logged in as {session?.user?.netId}</p>
    </div>
  );
}