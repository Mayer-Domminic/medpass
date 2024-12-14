'use client';
import React, { useState } from 'react';
import { Register, Login, Welcome } from '@/components/auth';
import { Toast } from '@/components/ui/toast';

type AuthView = 'welcome' | 'login' | 'register';

export default function AuthPage() {
  const [view, setView] = useState<AuthView>('welcome');

  const handleError = (error: Error) => {
    Toast({
      title: 'Error',
      variant: 'destructive',
    });
  };

  const renderView = () => {
    switch (view) {
      case 'welcome':
        return <Welcome onNavigate={setView} />;
      case 'login':
        return (
          <Login
            onError={handleError}
            onBack={() => setView('welcome')}
          />
        );
      case 'register':
        return (
          <Register
            onError={handleError}
            onBack={() => setView('welcome')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {renderView()}
    </div>
  );
}