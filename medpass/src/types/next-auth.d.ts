import { DefaultSession } from "next-auth";
import { JWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      username: string;
      issuperuser: boolean;
    } & DefaultSession["user"];
    accessToken?: string;
  }

  interface User {
    username: string;
    issuperuser: boolean;
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    username: string;
    issuperuser: boolean;
    accessToken?: string;
  }
}