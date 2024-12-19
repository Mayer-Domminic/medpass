'use client';
import { useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const { loginWithRedirect, isAuthenticated } = useAuth0();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-full max-w-md bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center text-white">Welcome to MedPASS</CardTitle>
          <p className="text-gray-400 text-center">Please sign in to continue</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full bg-blue-500 hover:bg-blue-600"
            onClick={() => loginWithRedirect()}
          >
            Sign In with Auth0
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}