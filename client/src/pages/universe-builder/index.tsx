import { useState } from "react";
import { FileUpload } from "@/components/universe-builder/file-upload";
import { MappingTable } from "@/components/universe-builder/mapping-table";
import { Review } from "@/components/universe-builder/review";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Step = "upload" | "mapping" | "review";

export default function UniverseBuilder() {
  const [step, setStep] = useState<Step>("upload");
  const handlePrevStep = () => {
    if (step === "mapping") setStep("upload");
    if (step === "review") setStep("mapping");
  };
  const [data, setData] = useState<{
    name: string;
    type: string;
    file: File | null;
    headers: string[];
    mappings: Record<string, string>;
    recordCount: number;
    columnValues: Record<string, string[]>;
    sampleData: Record<string, any>; // Added sampleData type for clarity
  }>({
    name: "",
    type: "",
    file: null,
    headers: [],
    mappings: {},
    recordCount: 0,
    columnValues: {},
    sampleData: {} //Initialized sampleData
  });

  const handleUploadComplete = (result: {
    name: string;
    type: string;
    file: File;
    headers: string[];
    recordCount: number;
  }) => {
    setData({
      ...data,
      ...result,
      mappings: {}
    });
    setStep("mapping");
  };

  const handleMappingComplete = (mappings: Record<string, string>) => {
    setData({
      ...data,
      mappings
    });
    setStep("review");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Create New Universe</h1>

      <Card>
        <Tabs value={step} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" disabled={step !== "upload"}>
              1. Upload Data
            </TabsTrigger>
            <TabsTrigger 
              value="mapping" 
              disabled={step !== "mapping"}
            >
              2. Map Fields
            </TabsTrigger>
            <TabsTrigger 
              value="review" 
              disabled={step !== "review"}
            >
              3. Review
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload">
            <FileUpload onComplete={handleUploadComplete} />
          </TabsContent>

          <TabsContent value="mapping">
            <MappingTable
              headers={data.headers}
              columnValues={data.columnValues}
              sampleData={data.sampleData}
              recordCount={data.recordCount}
              onComplete={handleMappingComplete}
              onBack={handlePrevStep}
            />
          </TabsContent>

          <TabsContent value="review">
            <Review
              name={data.name}
              type={data.type}
              recordCount={data.recordCount}
              mappings={data.mappings}
            />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}