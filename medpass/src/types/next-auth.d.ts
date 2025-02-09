import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      netId: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    netId: string;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    netId: string;
    accessToken?: string;
  }
}