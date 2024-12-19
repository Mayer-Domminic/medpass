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
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  const handleLogin = (connection?: string) => {
    loginWithRedirect({
      authorizationParams: {
        connection,
        prompt: 'login',
      },
      appState: {
        returnTo: '/dashboard'
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
          {/* Google Sign In */}
          <Button 
            className="w-full bg-white hover:bg-gray-100 text-gray-900"
            onClick={() => handleLogin('google-oauth2')}
            disabled={isLoading}
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </Button>

          {/* Email Sign In */}
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