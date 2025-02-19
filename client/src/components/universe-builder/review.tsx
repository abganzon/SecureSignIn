import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Check, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { InsertUniverse } from "@shared/schema";

interface ReviewProps {
  name: string;
  type: string;
  recordCount: number;
  mappings: Record<string, string>;
}

export function Review({ name, type, recordCount, mappings }: ReviewProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const createUniverse = useMutation({
    mutationFn: async (data: InsertUniverse) => {
      const res = await apiRequest("POST", "/api/universes", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Universe Created",
        description: "Your universe has been successfully created."
      });
      setLocation("/dashboard");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleCreate = () => {
    createUniverse.mutate({
      name,
      type,
      recordCount,
      mappings
    } as InsertUniverse);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Universe Name
            </label>
            <p className="text-lg font-medium">{name}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Universe Type
            </label>
            <p className="text-lg font-medium">{type}</p>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">
            Total Records from CSV File
          </label>
          <p className="text-2xl font-bold text-primary">{recordCount.toLocaleString()} records</p>
          <span className="text-sm text-muted-foreground">
            These records will be processed during universe creation
          </span>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Field Mappings
          </label>
          <div className="border rounded-lg p-4 space-y-2">
            {Object.entries(mappings).map(([source, target]) => (
              <div key={source} className="flex items-center gap-2">
                <span className="text-muted-foreground">{source}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{target}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleCreate}
        disabled={createUniverse.isPending}
      >
        {createUniverse.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Universe...
          </>
        ) : (
          <>
            <Check className="mr-2 h-4 w-4" />
            Create Universe
          </>
        )}
      </Button>
    </div>
  );
}
