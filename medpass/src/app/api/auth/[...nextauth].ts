import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    CredentialsProvider({
      name: 'NetID',
      credentials: {
        netid: { label: "NetID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.netid || !credentials?.password) return null;
        
        try {
          const formData = new URLSearchParams();
          formData.append('username', credentials.netid);
          formData.append('password', credentials.password);
          
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formData,
          });

          if (!response.ok) return null;
          
          const data = await response.json();
          
          return {
            id: credentials.netid,
            netId: credentials.netid,
            access_token: data.access_token,
            refresh_token: data.refresh_token,
          };
        } catch (e) {
          console.error('Auth error:', e);
          return null;
        }
      }
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        if (account.provider === 'google') {
          try {
            // Link Google account with NetID if needed
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/google/link`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                google_token: account.access_token,
                email: user.email,
              }),
            });
            
            if (response.ok) {
              const data = await response.json();
              return {
                ...token,
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                netId: data.net_id,
                studentData: data.student_data,
              };
            }
          } catch (error) {
            console.error('Error linking Google account:', error);
          }
        } else if (account.provider === 'credentials') {
          return {
            ...token,
            accessToken: user.access_token,
            refreshToken: user.refresh_token,
            netId: user.netId,
          };
        }
      }

      // Return previous token if not expired
      if (token.exp && Date.now() < token.exp * 1000) {
        return token;
      }

      // Token expired, try to refresh
      if (token.refreshToken) {
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token.refreshToken}`,
            },
          });
          
          const data = await response.json();
          
          if (!response.ok) throw data;
          
          return {
            ...token,
            accessToken: data.access_token,
            exp: data.exp,
          };
        } catch (error) {
          console.error('Error refreshing token:', error);
          return { ...token, error: 'RefreshAccessTokenError' };
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user.netId = token.netId;
      session.user.studentData = token.studentData;
      session.accessToken = token.accessToken as string;
      session.refreshToken = token.refreshToken as string;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export default NextAuth(authOptions);