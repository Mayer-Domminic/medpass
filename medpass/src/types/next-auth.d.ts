import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user?: {
      netId: string;
      isSuperuser: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    netId: string;
    isSuperuser: boolean;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    netId: string;
    isSuperuser: boolean;
    accessToken?: string;
  }
}