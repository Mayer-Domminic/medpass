import { UserData, UserProfile } from '@/types/userData';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const api = {
  async verifyNetId(token: string, netId: string) {
    const response = await fetch(`${API_URL}/api/v1/users/verify-netid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ net_id: netId }),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to verify NetID');
    }
    
    // Set the cookie upon successful verification
    document.cookie = "netid.verified=true; path=/";
    
    return response.json();
  },

  async createOrUpdateUser(token: string, userData: UserProfile) {
    const response = await fetch(`${API_URL}/api/v1/users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        auth0_id: userData.auth0Id,
        email: userData.email,
        full_name: userData.name,
        net_id: userData.netId,
      }),
    });
    
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Failed to create/update user');
    }
    
    return response.json();
  },

  async getUserData(token: string, netId: string): Promise<UserData> {
    const response = await fetch(`${API_URL}/api/v1/users/by-netid/${netId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || 'Failed to fetch user data');
    }

    return response.json();
  },
};

