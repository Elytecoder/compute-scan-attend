import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { parseMembersData } from "@/data/members-data";

const UploadMembers = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const handleUpload = async () => {
    setUploading(true);
    setUploadStatus("Processing members data...");

    try {
      const members = parseMembersData();
      setUploadStatus(`Uploading ${members.length} members...`);

      const { data, error } = await supabase
        .from("members")
        .insert(members)
        .select();

      if (error) {
        if (error.code === "23505") {
          toast.error("Some members already exist. Skipping duplicates.");
          setUploadStatus("Upload completed with some duplicates skipped.");
        } else {
          toast.error("Failed to upload members: " + error.message);
          setUploadStatus("Upload failed: " + error.message);
        }
      } else {
        toast.success(`Successfully uploaded ${data?.length || 0} members!`);
        setUploadStatus(`Upload successful! Added ${data?.length || 0} members.`);
      }
    } catch (err: any) {
      toast.error("An error occurred during upload");
      setUploadStatus("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Upload Members</h1>
        <p className="text-muted-foreground">Bulk upload members from Excel file</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Members Data</CardTitle>
          <CardDescription>
            This will upload {parseMembersData().length} members from the provided Excel file.
            Blocks will be left empty for manual editing later.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : "Upload Members"}
          </Button>

          {uploadStatus && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{uploadStatus}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadMembers;
