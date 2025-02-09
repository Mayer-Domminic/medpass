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
  netId: z
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

  fullName: z
    .string()
    .min(2, "Full name is required")
    .regex(
      /^[a-zA-Z\s-']+$/,
      "Full name can only contain letters, spaces, hyphens, and apostrophes"
    ),
});

export function RegisterForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      netId: "",
      email: "",
      password: "",
      fullName: "",
    },
  });

    const onSubmit = async (data: z.infer<typeof registerSchema>) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    net_id: data.netId,
                    email: data.email,
                    password: data.password,
                    full_name: data.fullName,
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
    <div className="bg-gray-900 p-6 rounded-lg shadow-lg text-white">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="netId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>NetID</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your NetID" {...field} className="bg-gray-800 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} className="bg-gray-800 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter your full name" {...field} className="bg-gray-800 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="Enter your password" {...field} className="bg-gray-800 text-white" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isLoading}>
            {isLoading ? "Loading..." : "Register"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
