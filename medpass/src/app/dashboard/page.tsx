"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  useEffect(() => {
    if (session?.user?.isSuperuser) {
      redirect("/admin");
    }

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
    <div className="bg-background"><Dashboard /></div>
  );
}