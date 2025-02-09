"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function AdminPage() {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect("/auth/login");
    },
  });

  useEffect(() => {
    if (session && !session.user?.isSuperuser) {
      redirect("/dashboard");
    }
  }, [session]);

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Admin Page</h1>
      {/* Your admin components */}
    </div>
  );
}