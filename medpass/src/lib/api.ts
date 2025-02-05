export const API_URL = 'http://api.medpass.unr.dev';

export interface UserProfile {
  auth0Id: string;
  email: string;
  netId?: string;
  name?: string;
  picture?: string;
}

export const api = {
  async verifyNetId(token: string, netId: string) {
    const response = await fetch(`${API_URL}/api/v1/users/verify-netid`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ net_id: netId }), // Changed to match backend schema
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
};