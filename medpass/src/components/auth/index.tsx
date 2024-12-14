import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/lib/auth/context';
import { useRouter } from 'next/navigation';

interface AuthProps {
  onBack: () => void;
  onError: (error: Error) => void;
}

interface WelcomeProps {
  onNavigate: (view: 'login' | 'register') => void;
}

export const Register: React.FC<AuthProps> = ({ onBack, onError }) => {
  const { register } = useAuth();
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }
      await register(formData.username, formData.email, formData.password);
    } catch (error) {
      onError(error as Error);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-white">Register</CardTitle>
        <p className="text-center text-gray-400">Create your account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-gray-300">Username</Label>
            <Input 
              id="username"
              type="text" 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input 
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input 
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-gray-300">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
            Create Account
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="text-gray-400">
          Back
        </Button>
      </CardFooter>
    </Card>
  );
};

export const Login: React.FC<AuthProps> = ({ onBack, onError }) => {
  const { login } = useAuth();
  const [formData, setFormData] = React.useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      onError(error as Error);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center text-white">Welcome Back</CardTitle>
        <p className="text-center text-gray-400">Sign in to your account</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-300">Email</Label>
            <Input 
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-gray-300">Password</Label>
            <Input 
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
              className="bg-gray-800 border-gray-700 text-white"
            />
          </div>
          <Button type="submit" className="w-full bg-blue-500 hover:bg-blue-600">
            Sign In
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="ghost" onClick={onBack} className="text-gray-400">
          Back
        </Button>
      </CardFooter>
    </Card>
  );
};

export const Welcome: React.FC<WelcomeProps> = ({ onNavigate }) => {
  const { register } = useAuth();
  const router = useRouter();

  const handleMockAuth = async () => {
    try {
      await register(
        'Mock User',
        'mock@example.com',
        'password123'
      );
    } catch (error) {
      console.error('Mock auth failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md bg-white/5 border-gray-800 hover:bg-white/10 transition-colors">
      <CardHeader className="space-y-1">
        <CardTitle className="text-3xl text-center text-white">Welcome to MedPASS</CardTitle>
        <p className="text-gray-400 text-center">Please choose an option to continue</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          className="w-full bg-blue-500 hover:bg-blue-600"
          onClick={() => onNavigate('login')}
        >
          Sign In
        </Button>
        <Button 
          variant="outline" 
          className="w-full bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
          onClick={() => onNavigate('register')}
        >
          Create Account
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-gray-500">Or</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          className="w-full bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700"
          onClick={handleMockAuth}
        >
          Skip Login (Mock Auth)
        </Button>
      </CardContent>
    </Card>
  );
};