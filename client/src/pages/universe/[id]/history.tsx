
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { UniverseHistory } from "@shared/schema";

export default function UniverseHistory() {
  const { id } = useParams();
  const { data: history } = useQuery<UniverseHistory[]>({ 
    queryKey: [`/api/universes/${id}/history`]
  });

  if (!history) return null;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Universe History</h1>

      <Card>
        <CardHeader>
          <CardTitle>Edit History</CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {history.map((entry) => (
                <div key={entry.id} className="border rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">{entry.action}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{entry.description}</p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
