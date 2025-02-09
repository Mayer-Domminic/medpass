import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      netId: string;
      is_superuser: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    netId: string;
    is_superuser: boolean;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    netId: string;
    is_superuser: boolean;
    accessToken?: string;
  }
}