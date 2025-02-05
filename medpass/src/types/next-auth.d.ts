import { DefaultSession, DefaultUser } from 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      netId?: string;
      email: string;
      studentData?: {
        cumGpa: number;
        bcpmGpa: number;
        graduated: boolean;
      };
    } & DefaultSession['user'];
    accessToken: string;
    refreshToken: string;
    error?: string;
  }

  interface User extends DefaultUser {
    netId?: string;
    access_token?: string;
    refresh_token?: string;
    studentData?: {
      cumGpa: number;
      bcpmGpa: number;
      graduated: boolean;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    netId?: string;
    accessToken?: string;
    refreshToken?: string;
    studentData?: {
      cumGpa: number;
      bcpmGpa: number;
      graduated: boolean;
    };
    exp?: number;
    error?: string;
  }
}