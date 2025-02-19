
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Universe } from "@shared/schema";

export default function UniverseView() {
  const { id } = useParams();
  const { data: universe } = useQuery<Universe>({ 
    queryKey: [`/api/universes/${id}`]
  });

  if (!universe) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{universe.name}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Universe Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Type</label>
                <p className="text-lg font-medium">{universe.type}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Records</label>
                <p className="text-lg font-medium">{universe.recordCount}</p>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Field Mappings</label>
              <div className="border rounded-lg p-4 space-y-2">
                {Object.entries(universe.mappings).map(([source, target]) => (
                  <div key={source} className="flex items-center gap-2">
                    <span className="text-muted-foreground">{source}</span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">{target}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
