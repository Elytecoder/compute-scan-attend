import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, CheckCircle2, AlertCircle } from "lucide-react";
import { parseMembersData } from "@/data/members-data";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";

const UploadMembers = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [stats, setStats] = useState<{
    total: number;
    existing: number;
    newMembers: number;
    uploaded: number;
  } | null>(null);
  const [progress, setProgress] = useState(0);
  const [missingMembers, setMissingMembers] = useState<Array<{
    school_id: string;
    name: string;
    program: string;
    year_level: number;
  }>>([]);

  useEffect(() => {
    const analyzeData = async () => {
      const allMembers = parseMembersData();
      const { data: existingMembers } = await supabase
        .from("members")
        .select("school_id");

      const existingIds = new Set(existingMembers?.map(m => m.school_id) || []);
      const newMembers = allMembers.filter(m => !existingIds.has(m.school_id));

      setStats({
        total: allMembers.length,
        existing: existingIds.size,
        newMembers: newMembers.length,
        uploaded: 0,
      });
      setMissingMembers(newMembers);
    };

    analyzeData();
  }, []);

  const handleUpload = async () => {
    setUploading(true);
    setUploadStatus("Fetching existing members...");
    setProgress(10);

    try {
      const allMembers = parseMembersData();
      
      // Fetch existing school IDs
      const { data: existingMembers } = await supabase
        .from("members")
        .select("school_id");

      setProgress(30);
      const existingIds = new Set(existingMembers?.map(m => m.school_id) || []);
      
      // Filter out existing members and deduplicate within new data
      const seenIds = new Set<string>();
      const newMembers = allMembers.filter(m => {
        if (existingIds.has(m.school_id) || seenIds.has(m.school_id)) {
          return false;
        }
        seenIds.add(m.school_id);
        return true;
      });

      if (newMembers.length === 0) {
        toast.info("All members are already in the database!");
        setUploadStatus("No new members to upload. All members already exist.");
        setProgress(100);
        return;
      }

      setUploadStatus(`Uploading ${newMembers.length} new members...`);
      setProgress(50);

      // Insert only new members
      const { data, error } = await supabase
        .from("members")
        .insert(newMembers)
        .select();

      setProgress(90);

      if (error) {
        toast.error("Failed to upload members: " + error.message);
        setUploadStatus("Upload failed: " + error.message);
      } else {
        const uploadedCount = data?.length || 0;
        toast.success(`Successfully uploaded ${uploadedCount} new members!`);
        setUploadStatus(
          `Upload complete! Added ${uploadedCount} new members. ${existingIds.size} members already existed.`
        );
        setStats(prev => prev ? { ...prev, uploaded: uploadedCount } : null);
        setProgress(100);
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
            Upload member data from the parsed Excel file to the database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Total Members</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Already in Database</p>
                <p className="text-2xl font-bold">{stats.existing}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">New Members</p>
                <p className="text-2xl font-bold text-primary">{stats.newMembers}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Uploaded</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.uploaded}
                  {stats.uploaded > 0 && <CheckCircle2 className="inline ml-2 h-5 w-5" />}
                </p>
              </div>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={uploading || (stats?.newMembers === 0)}
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? "Uploading..." : stats?.newMembers === 0 ? "All Members Uploaded" : `Upload ${stats?.newMembers || 0} New Members`}
          </Button>

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">{progress}%</p>
            </div>
          )}

          {uploadStatus && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm">{uploadStatus}</p>
            </div>
          )}

          {missingMembers.length > 0 && (
            <Collapsible className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  View {missingMembers.length} Missing Members
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <ScrollArea className="h-[300px] rounded-md border p-4">
                  <div className="space-y-2">
                    {missingMembers.map((member, index) => (
                      <div key={index} className="p-2 bg-muted rounded text-sm">
                        <p className="font-medium">{member.school_id} - {member.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {member.program} - Year {member.year_level}
                        </p>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UploadMembers;
