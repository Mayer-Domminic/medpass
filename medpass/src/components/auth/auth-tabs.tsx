"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "../auth/login-form";
import { RegisterForm } from "../auth/register-form";

export function AuthTabs() {
  return (
    <Tabs defaultValue="login" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-800 text-white rounded-lg p-1">
        <TabsTrigger value="login" data-tab="login" className="data-[state=active]:bg-gray-700 rounded-lg">
          Login
        </TabsTrigger>
        <TabsTrigger value="register" className="data-[state=active]:bg-gray-700 rounded-lg">
          Register
        </TabsTrigger>
      </TabsList>

      <TabsContent value="login">
        <LoginForm />
      </TabsContent>

      <TabsContent value="register">
        <RegisterForm />
      </TabsContent>
    </Tabs>
  );
}
