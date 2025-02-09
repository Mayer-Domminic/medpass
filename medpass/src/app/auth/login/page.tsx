import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthTabs } from "@/components/auth/auth-tabs";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-gray-900 to-gray-800">
      <Card className="w-full max-w-md bg-gray-700 border border-gray-600 shadow-lg rounded-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-white">Welcome Back</CardTitle>
          <CardDescription className="text-gray-300">
            Login or create an account to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthTabs />
        </CardContent>
      </Card>
    </div>
  );
}
