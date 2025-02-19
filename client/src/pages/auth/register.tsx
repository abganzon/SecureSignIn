import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SiGoogle, SiGithub } from "react-icons/si";

export default function Register() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Create Your Account
          </CardTitle>
          <CardDescription className="text-center">
            Sign up with your preferred social account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/api/auth/google"}
          >
            <SiGoogle className="mr-2 h-4 w-4" />
            Sign up with Google
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => window.location.href = "/api/auth/github"}
          >
            <SiGithub className="mr-2 h-4 w-4" />
            Sign up with GitHub
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
