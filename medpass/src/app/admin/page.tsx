"use client"


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

  if (status === "loading") {
    return <div>Loading...</div>;
  }

  // Non-superuser view
  if (session?.user && !session.user.issuperuser) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">Limited Access</h2>
          <p className="text-yellow-700 mb-4">
            This page is intended for administrators only. You are currently logged in as a regular user.
          </p>
          <button
            onClick={() => redirect('/dashboard')}
            className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 font-medium py-2 px-4 rounded transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Admin view
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <p className="text-green-800">
            Logged in as administrator: {session?.user?.username}
          </p>
        </div>
        <pre>{JSON.stringify(session, null, 2)}</pre>
      </div>
    </div>
  );
}