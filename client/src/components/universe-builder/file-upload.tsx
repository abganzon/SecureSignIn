import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, Loader2 } from "lucide-react";
import Papa from "papaparse";

const formSchema = z.object({
  name: z.string().min(1, "Universe name is required"),
  type: z.string().min(1, "Universe type is required"),
  file: z.instanceof(File).refine(file => file.size <= 50 * 1024 * 1024, "File size must be less than 50MB")
});

interface FileUploadProps {
  onComplete: (result: {
    name: string;
    type: string;
    file: File;
    headers: string[];
    recordCount: number;
  }) => void;
}

export function FileUpload({ onComplete }: FileUploadProps) {
  const [progress, setProgress] = useState(0);
  const [parsing, setParsing] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema)
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setParsing(true);
    
    Papa.parse(data.file, {
      header: true,
      skipEmptyLines: true,
      step: (results, parser) => {
        const progress = (results.meta.cursor / data.file.size) * 100;
        setProgress(Math.min(progress, 100));
      },
      complete: (results) => {
        setParsing(false);
        
        // Get unique values for each column
        const columnValues: Record<string, Set<string>> = {};
        const headers = results.meta.fields || [];
        
        results.data.forEach((row: any) => {
          headers.forEach(header => {
            if (!columnValues[header]) {
              columnValues[header] = new Set();
            }
            if (row[header]) {
              columnValues[header].add(row[header].toString());
            }
          });
        });

        onComplete({
          name: data.name,
          type: data.type,
          file: data.file,
          headers,
          recordCount: results.data.length,
          columnValues: Object.fromEntries(
            Object.entries(columnValues).map(([k, v]) => [k, Array.from(v)])
          )
        });
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Universe Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter universe name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Universe Type</FormLabel>
              <FormControl>
                <Input placeholder="Enter universe type" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file"
          render={({ field: { value, onChange, ...field } }) => (
            <FormItem>
              <FormLabel>Upload Data File</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={(e) => onChange(e.target.files?.[0])}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {parsing && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Parsing file... {Math.round(progress)}%
            </p>
          </div>
        )}

        <Button type="submit" disabled={parsing} className="w-full">
          {parsing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Upload and Continue
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}
