import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AVAILABLE_MAPPINGS } from "@shared/schema";
import { calculateMappingScore } from "@/lib/mapping";
import { ArrowRight, ArrowRightLeft } from "lucide-react";

interface MappingTableProps {
  headers: string[];
  onComplete: (mappings: Record<string, string>) => void;
}

export function MappingTable({ headers, onComplete }: MappingTableProps) {
  const [mappings, setMappings] = useState<Record<string, string>>({});
  const [matchScores, setMatchScores] = useState<Record<string, number>>({});

  // Get database fields excluding Identity Information
  const databaseFields = Object.entries(AVAILABLE_MAPPINGS)
    .filter(([key]) => key !== 'identity')
    .flatMap(([_, category]) =>
      category.fields.map(field => ({
        value: field.value,
        label: field.label,
        category: category.title
      }))
    );

  useEffect(() => {
    // Auto-map on initial load
    const autoMappings: Record<string, string> = {};
    const scores: Record<string, number> = {};

    databaseFields.forEach(field => {
      let bestMatch = { header: "", score: 0 };

      headers.forEach(header => {
        const score = calculateMappingScore(header, field.label);
        if (score > bestMatch.score && score > 0.6) {
          bestMatch = { header, score };
        }
      });

      if (bestMatch.header) {
        autoMappings[field.value] = bestMatch.header;
        scores[field.value] = bestMatch.score;
      }
    });

    setMappings(autoMappings);
    setMatchScores(scores);
  }, [headers]);

  const getMatchScoreBadge = (score: number | undefined) => {
    if (!score) return null;

    const variants = {
      high: "bg-green-100 text-green-700",
      medium: "bg-yellow-100 text-yellow-700",
      low: "bg-red-100 text-red-700"
    };

    let variant = "low";
    if (score > 0.8) variant = "high";
    else if (score > 0.6) variant = "medium";

    return (
      <Badge variant="outline" className={variants[variant]}>
        {score > 0.8 ? "High Match" : score > 0.6 ? "Medium Match" : "Low Match"}
        {" "}({Math.round(score * 100)}%)
      </Badge>
    );
  };

  // Group database fields by category
  const groupedFields = Object.entries(AVAILABLE_MAPPINGS).map(([key, category]) => ({
    category: category.title,
    fields: category.fields
  }));

  const getUnmappedHeaders = () => {
    const mappedHeaders = Object.values(mappings);
    return headers.filter(header => !mappedHeaders.includes(header));
  };

  return (
    <div className="p-6 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Field Mapping</h3>
          <Button
            variant="outline"
            onClick={() => {
              setMappings({});
              setMatchScores({});
            }}
          >
            Reset Mappings
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Database Field</TableHead>
              <TableHead></TableHead>
              <TableHead>CSV Column</TableHead>
              <TableHead>Match Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groupedFields.map(group => (
              <>
                <TableRow key={group.category}>
                  <TableCell colSpan={4} className="bg-muted/50">
                    <h4 className="font-medium text-sm">{group.category}</h4>
                  </TableCell>
                </TableRow>
                {group.fields.map(field => (
                  <TableRow key={field.value}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>
                      <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={mappings[field.value] || ""}
                        onValueChange={(header) => {
                          const score = calculateMappingScore(header, field.label);
                          setMatchScores(prev => ({ ...prev, [field.value]: score }));
                          setMappings(prev => ({ ...prev, [field.value]: header }));
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CSV column" />
                        </SelectTrigger>
                        <SelectContent>
                          {headers.map(header => (
                            <SelectItem key={header} value={header}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {getMatchScoreBadge(matchScores[field.value])}
                    </TableCell>
                  </TableRow>
                ))}
              </>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Unmapped CSV Columns */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Unmapped CSV Columns</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getUnmappedHeaders().map(header => (
            <div key={header} className="p-4 border rounded-lg">
              <span className="text-sm">{header}</span>
            </div>
          ))}
        </div>
      </div>

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