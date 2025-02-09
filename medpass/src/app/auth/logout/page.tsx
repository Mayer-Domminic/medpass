"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      try {
        await signOut({ redirect: false }); // Clears session
        router.push("/auth/login"); // Redirect to login page
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    logout();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <p className="text-lg">Logging out...</p>
    </div>
  );
}
