import React, { useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from '@/lib/api';

const NetIDVerification = () => {
  const [netId, setNetId] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { getAccessTokenSilently, user } = useAuth0();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const token = await getAccessTokenSilently();
      
      // Verify NetID
      await api.verifyNetId(token, netId);
      
      // Create/Update user profile with NetID
      await api.createOrUpdateUser(token, {
        auth0Id: user?.sub,
        email: user?.email,
        name: user?.name,
        picture: user?.picture,
        netId
      });

      router.push('/dashboard');
    } catch (err) {
      setError('Failed to verify NetID. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      <Card className="w-full max-w-md bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center text-white">Verify Your NetID</CardTitle>
          <p className="text-gray-400 text-center">Please enter your UNR NetID to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="Enter your NetID"
                value={netId}
                onChange={(e) => setNetId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white"
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Verify NetID'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetIDVerification;