"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "../auth/login-form";
import { RegisterForm } from "../auth/register-form";

export function AuthTabs() {
  return (
    <div className="w-full max-w-md mx-auto">
      <Tabs defaultValue="login" className="w-full">
        <TabsList className="w-full grid grid-cols-2 bg-gray-900/50 backdrop-blur-sm rounded-xl p-1">
          <TabsTrigger 
            value="login" 
            data-tab="login" 
            className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Login
          </TabsTrigger>
          <TabsTrigger 
            value="register" 
            className="data-[state=active]:bg-gray-800 text-gray-400 data-[state=active]:text-white rounded-lg transition-all duration-300"
          >
            Register
          </TabsTrigger>
        </TabsList>
        <div className="mt-6">
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
