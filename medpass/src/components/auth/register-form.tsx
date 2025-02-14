"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, "NetID must be at least 3 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "NetID can only contain letters, numbers, and underscores"),

  email: z
    .string()
    .email("Invalid email address")
    .regex(
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Invalid email format"
    ),

  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    )
    .refine(
      (password) => {
        const commonPatterns = [
          /12345/,
          /qwerty/,
          /password/,
          /admin/,
          /letmein/
        ];
        return !commonPatterns.some((pattern) => 
          pattern.test(password.toLowerCase())
        );
      },
      {
        message: "Password contains common patterns that are easily guessed"
      }
    ),
});

export function RegisterForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: ""
    },
  });

  const onSubmit = async (data: z.infer<typeof registerSchema>) => {
      setIsLoading(true);
      try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  username: data.username,
                  email: data.email,
                  password: data.password,
              }),
          });

          if (!response.ok) {
              const error = await response.json();
              throw new Error(error.detail || "Registration failed");
          }

          if (response.ok) {
              console.log('Register success!')
          }

          toast({
              title: "Success",
              description: "Registration successful! Please login.",
          });

          setTimeout(() => {
              const loginTab = document.querySelector('[data-tab="login"]') as HTMLButtonElement | null;
              loginTab?.click();
          }, 500);

      } catch (error) {
          toast({
              title: "Error",
              description: error instanceof Error ? error.message : "Registration failed",
              variant: "destructive",
          });
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="bg-gray-900/30 backdrop-blur-sm p-8 rounded-2xl border border-gray-800">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">NetID</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter your NetID" 
                    {...field} 
                    className="h-12 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500
                             focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                             transition-all duration-300" 
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Email</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="Enter your email" 
                    {...field} 
                    className="h-12 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500
                             focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                             transition-all duration-300" 
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-sm" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-300">Password</FormLabel>
                <FormControl>
                  <Input 
                    type="password" 
                    placeholder="Enter your password" 
                    {...field} 
                    className="h-12 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500
                             focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20
                             transition-all duration-300" 
                  />
                </FormControl>
                <FormMessage className="text-red-400 text-sm" />
              </FormItem>
            )}
          />
          <Button 
            type="submit" 
            className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white
                     transition-all duration-300 rounded-xl
                     disabled:opacity-50 disabled:cursor-not-allowed
                     focus:ring-2 focus:ring-blue-500/20"
            disabled={isLoading}
          >
            {isLoading ? 
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                <span>Registering...</span>
              </div> 
              : 
              "Register"
            }
          </Button>
        </form>
      </Form>
    </div>
  );
}