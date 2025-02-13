"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

const loginSchema = z.object({
  netId: z.string().min(3, "NetID must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export function LoginForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      netId: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        netId: data.netId,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        toast({
          title: "Error",
          description: "Invalid credentials",
          variant: "destructive",
        });
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
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
            name="netId"
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
                <span>Logging in...</span>
              </div> 
              : 
              "Login"
            }
          </Button>
        </form>
      </Form>
    </div>
  );
}
