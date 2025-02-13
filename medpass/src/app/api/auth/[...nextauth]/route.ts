import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

// DYNAMIC FORCE REQUIRED
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  netId: string;
  name?: string | null;
  email?: string | null;
  accessToken?: string;
  is_superuser: boolean;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
        name: "NetID",
        credentials: {
        netId: { label: "NetID", type: "text" },
        password: { label: "Password", type: "password" }
    },
    async authorize(credentials): Promise<User | null> { // TODO FIX ERRORs
        if (!credentials?.netId || !credentials?.password) {
            return null;
        }
    
        try {
            console.log("Sending credentials:", credentials);
    
            const formData = new URLSearchParams();
            formData.append("username", credentials.netId);
            formData.append("password", credentials.password);
    
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });
    
            const data = await response.json();
    
            if (response.ok && data.access_token) {
              return {
                  id: credentials.netId,
                  netId: credentials.netId,
                  accessToken: data.access_token,
                  is_superuser: data.is_superuser,
              };
            }
    
            return null;
        } catch (error) {
            console.error("Authentication error:", error);
            return null;
        }
    }}),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.netId = user.netId;
        token.accessToken = user.accessToken;
        token.is_superuser = user.is_superuser;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          netId: token.netId,
          is_superuser: token.is_superuser,
        },
        accessToken: token.accessToken,
      };
    },
  },
  pages: {
    signIn: "/auth/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
});

export { handler as GET, handler as POST };