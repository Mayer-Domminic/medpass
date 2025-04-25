import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";

// DYNAMIC FORCE REQUIRED
export const dynamic = 'force-dynamic';

interface User {
  id: string;
  username: string;
  email?: string | null;
  accessToken?: string;
  issuperuser: boolean;
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
        name: "Username",
        credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
    },
    async authorize(credentials): Promise<User | null> { // TODO FIX ERRORs
        if (!credentials?.username || !credentials?.password) {
            return null;
        }
    
        try {
            console.log("Sending credentials:", credentials);
    
            const formData = new URLSearchParams();
            formData.append("username", credentials.username);
            formData.append("password", credentials.password);

            console.log(formData)
    
            const response = await fetch(`http://backend:8000/api/v1/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                body: formData.toString(),
            });
    
            const data = await response.json();
    
            if (response.ok && data.access_token) {
              return {
                  id: credentials.username,
                  username: credentials.username,
                  accessToken: data.access_token,
                  issuperuser: data.issuperuser,
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
        token.username = user.username;
        token.accessToken = user.accessToken;
        token.issuperuser = user.issuperuser;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          username: token.username,
          issuperuser: token.issuperuser,
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