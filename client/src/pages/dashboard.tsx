import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Globe, Database } from "lucide-react";
import { Link } from "wouter";
import type { Universe } from "@shared/schema";

export default function Dashboard() {
  const { data: universes } = useQuery<Universe[]>({ 
    queryKey: ["/api/universes"]
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Your Universes</h1>
        <Link href="/universe-builder">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Universe
          </Button>
        </Link>
      </div>

      {universes?.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground/60 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No Universes Yet</h2>
            <p className="text-muted-foreground mb-4">
              Start by creating your first universe to begin mapping data.
            </p>
            <Link href="/universe-builder">
              <Button>Create Your First Universe</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {universes?.map((universe) => (
            <Card key={universe.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {universe.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium">{universe.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Records</span>
                    <span className="font-medium">{universe.recordCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {new Date(universe.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
