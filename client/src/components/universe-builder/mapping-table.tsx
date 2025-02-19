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

  // Get all available target fields
  const allTargetFields = Object.values(AVAILABLE_MAPPINGS).flatMap(category => 
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

    headers.forEach(header => {
      let bestMatch = { field: "", score: 0 };

      allTargetFields.forEach(field => {
        const score = calculateMappingScore(header, field.label);
        if (score > bestMatch.score && score > 0.6) {
          bestMatch = { field: field.value, score };
        }
      });

      if (bestMatch.field) {
        autoMappings[header] = bestMatch.field;
        scores[header] = bestMatch.score;
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

  const getFieldDetails = (value: string) => {
    for (const category of Object.values(AVAILABLE_MAPPINGS)) {
      const field = category.fields.find(f => f.value === value);
      if (field) {
        return {
          label: field.label,
          category: category.title
        };
      }
    }
    return null;
  };

  // Group unmapped target fields by category
  const getUnmappedFields = () => {
    const mappedValues = Object.values(mappings);
    return Object.entries(AVAILABLE_MAPPINGS).map(([key, category]) => ({
      category: category.title,
      fields: category.fields.filter(field => !mappedValues.includes(field.value))
    })).filter(group => group.fields.length > 0);
  };

  return (
    <div className="p-6 space-y-8">
      {/* Field Mapping Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Field Mapping</h3>
          <Button 
            variant="outline" 
            onClick={() => {
              const newMappings = {};
              const newScores = {};
              setMappings(newMappings);
              setMatchScores(newScores);
            }}
          >
            Reset Mappings
          </Button>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CSV Column</TableHead>
              <TableHead></TableHead>
              <TableHead>Target Field</TableHead>
              <TableHead>Match Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {headers.map((header) => (
              <TableRow key={header}>
                <TableCell className="font-medium">{header}</TableCell>
                <TableCell>
                  <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                </TableCell>
                <TableCell>
                  <Select
                    value={mappings[header] || ""}
                    onValueChange={(value) => {
                      const fieldDetails = getFieldDetails(value);
                      if (fieldDetails) {
                        const score = calculateMappingScore(header, fieldDetails.label);
                        setMatchScores(prev => ({ ...prev, [header]: score }));
                      }
                      setMappings(prev => ({ ...prev, [header]: value }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue>
                        {mappings[header] ? 
                          getFieldDetails(mappings[header])?.label : 
                          "Select field"}
                      </SelectValue>
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
                  {getMatchScoreBadge(matchScores[header])}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Unmapped Fields */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Unmapped Fields</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {getUnmappedFields().map(({ category, fields }) => (
            <div key={category} className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2 text-muted-foreground">{category}</h4>
              <ul className="space-y-2">
                {fields.map(field => (
                  <li key={field.value} className="text-sm">
                    {field.label}
                  </li>
                ))}
              </ul>
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