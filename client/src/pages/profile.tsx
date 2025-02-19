import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@shared/schema";

export default function Profile() {
  const { data: user } = useQuery<User>({ 
    queryKey: ["/api/user"]
  });

  if (!user) return null;

  const getAccountType = (user: User) => {
    if (user.googleId) return "Google Account";
    if (user.githubId) return "GitHub Account";
    return "Email Account";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Profile Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user.username}</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid gap-1">
              <label className="text-sm font-medium">Account Type</label>
              <p className="text-sm text-muted-foreground">
                {getAccountType(user)}
              </p>
            </div>

            <div className="grid gap-1">
              <label className="text-sm font-medium">Member Since</label>
              <p className="text-sm text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}