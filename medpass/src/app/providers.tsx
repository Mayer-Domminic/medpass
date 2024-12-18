'use client';

import { Auth0ProviderWithNavigate } from '@/providers/auth0-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Auth0ProviderWithNavigate>
      {children}
    </Auth0ProviderWithNavigate>
  );
}
