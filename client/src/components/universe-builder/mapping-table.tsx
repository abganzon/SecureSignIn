import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MAPPINGS } from "@shared/schema";
import { calculateMappingScore } from "@/lib/mapping";
import { ArrowRight } from "lucide-react";

interface MappingTableProps {
  headers: string[];
  onComplete: (mappings: Record<string, string>) => void;
}

export function MappingTable({ headers, onComplete }: MappingTableProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});

  useEffect(() => {
    // Auto-map on initial load
    const autoMappings: Record<string, string> = {};
    headers.forEach(header => {
      let bestMatch = { field: "", score: 0 };
      
      Object.values(AVAILABLE_MAPPINGS).forEach(category => {
        category.fields.forEach(field => {
          const score = calculateMappingScore(header, field.label);
          if (score > bestMatch.score && score > 0.6) {
            bestMatch = { field: field.value, score };
          }
        });
      });

      if (bestMatch.field) {
        autoMappings[header] = bestMatch.field;
      }
    });

    setMappings(autoMappings);
  }, [headers]);

  const getMappingScore = (header: string, mapping: string) => {
    let fieldLabel = "";
    Object.values(AVAILABLE_MAPPINGS).forEach(category => {
      const field = category.fields.find(f => f.value === mapping);
      if (field) fieldLabel = field.label;
    });
    
    const score = calculateMappingScore(header, fieldLabel);
    if (score > 0.8) return "High";
    if (score > 0.6) return "Medium";
    return "Low";
  };

  const getScoreBadge = (score: string) => {
    const variants: Record<string, { color: string; bg: string }> = {
      High: { color: "text-green-700", bg: "bg-green-100" },
      Medium: { color: "text-yellow-700", bg: "bg-yellow-100" },
      Low: { color: "text-red-700", bg: "bg-red-100" }
    };
    
    return (
      <Badge variant="outline" className={`${variants[score].color} ${variants[score].bg}`}>
        {score}
      </Badge>
    );
  };

  return (
    <div className="p-6 space-y-6">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>CSV Column</TableHead>
            <TableHead>Database Field</TableHead>
            <TableHead>Match Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {headers.map((header) => (
            <TableRow key={header}>
              <TableCell>{header}</TableCell>
              <TableCell>
                <Select
                  value={mappings[header] || ""}
                  onValueChange={(value) => 
                    setMappings({ ...mappings, [header]: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(AVAILABLE_MAPPINGS).map(([key, category]) => (
                      <div key={key}>
                        <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                          {category.title}
                        </div>
                        {category.fields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                {mappings[header] && 
                  getScoreBadge(getMappingScore(header, mappings[header]))
                }
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Button 
        className="w-full"
        onClick={() => onComplete(mappings)}
      >
        Continue to Review
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
