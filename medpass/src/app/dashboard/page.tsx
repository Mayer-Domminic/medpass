"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { signOut } from "next-auth/react";

export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  useEffect(() => {
    if (session?.user?.issuperuser) {
      console.log("ADMIN")
      redirect("/admin");
    }

    const fetchStudentInfo = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/student/info`, {
          headers: {
            Authorization: `Bearer ${session?.accessToken}`,
          },
        });

        const data = await response.json();
        console.log("Student Info:", data);

        if (response.status === 401) {
          // clear the NextAuth session and send user back to login
          await signOut({ callbackUrl: "/auth/login" });
          return;
        }
        
      } catch (error) {
        console.log("None found!")
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