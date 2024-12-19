import React from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const { loginWithRedirect, isLoading, isAuthenticated } = useAuth0();
  const router = useRouter();

  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/auth/verify-netid');
    }
  }, [isAuthenticated, router]);

  const handleLogin = (connection?: string) => {
    loginWithRedirect({
      authorizationParams: {
        connection,
        prompt: 'login',
      },
      appState: {
        returnTo: '/auth/verify-netid'
      }
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-full max-w-md bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl text-center text-white">Welcome to MedPASS</CardTitle>
          <p className="text-gray-400 text-center">Choose how to sign in</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            className="w-full bg-white hover:bg-gray-100 text-gray-900"
            onClick={() => handleLogin('google-oauth2')}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {/* Google icon paths */}
            </svg>
            Continue with Google
          </Button>

          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => handleLogin()}
            disabled={isLoading}
          >
            <Mail className="w-5 h-5 mr-2" />
            Continue with Email
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;