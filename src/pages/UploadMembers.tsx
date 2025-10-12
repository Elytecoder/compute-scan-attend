import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload } from "lucide-react";

// Complete member data extracted from List_of_CICT.xlsx
const membersData = `
25-197015	REXTER FURIO BAILON	BSCS
25-198897	JASPER BONGALOSA BALONA	BSCS
25-100346	JUNIE ANN GUAÑIZO BARRIL	BSCS
25-111663	EZEKIEL LIAN BERTOS	BSCS
25-109419	HEART GELUA BITANCOR	BSCS
25-198896	HANNA BURGOS BRIONES	BSCS
25-102664	MICHAELA PANELO BRIZUELA	BSCS
25-198063	ALEXANDREA ONGOTAN DAGOC	BSCS
25-198918	AIRA NICOLE GIDO DASIG	BSCS
25-199924	RICHARD JR. ERATO DEJUMO	BSCS
25-109996	LARA CRISTINA BARCELO DELIMA	BSCS
25-197192	JASON BALOLOY DOMENS	BSCS
25-104668	JAY LOU GALICIO DOMINGUEZ	BSCS
25-104044	JOHN MARVIN TISOY DUQUE	BSCS
25-108157	JELA GREFALDO ENTERIA	BSCS
25-102960	KEVIN ESCANILLA ERANDIO	BSCS
25-107100	MARZHA LOUISE JAÑOLAN FORTES	BSCS
25-110896	CLARISSE GALIT GARAIS	BSCS
24-189249	LOUIS MARIO GARDUQUE	BSCS
25-112126	JAMILA GARBIDA GARDUQUE	BSCS
25-111486	SELWYN SAYSON GELUA	BSCS
25-101920	NICOLE GUBAN GIGANTOCA	BSCS
25-111608	DUALI GOLPEO GILE	BSCS
25-198163	NORELLE CHAIN INFIESTO GLEE	BSCS
25-105006	JIERSON GUETAN GODALLE	BSCS
25-106073	PATRICK EMPLEO GODILO	BSCS
25-107528	MIA GRANTOS GOGOLIN	BSCS
25-106386	GIAN VINCENT GLORIANA GOJAR	BSCS
25-111707	JONARD LOURENZ ABANTE GOMEZ	BSCS
25-199053	LAN MARINDA GOYAL	BSCS
25-108988	VAILYN PANCHO GOYAL	BSCS
25-102194	EMERSON GERONA GURAY	BSCS
25-110233	ROMAN ANDREW VARGAS HERMO	BSCS
25-109753	JOHN CARLO CHIJA HIPOS	BSCS
25-108456	SHANELLE MARIE LORILLA HUBILLA	BSCS
25-108636	DARREN FURING JURADO	BSCS
23-176837	JOHN NOEL DOMINGUEZ LIZANO	BSCS
25-109539	NORMAN TOLOSA LLAGAS	BSCS
25-111130	ARYANNAH KIM MONTICALVO MAHUSAY	BSCS
25-101524	ROMAN AGNOTE MARINDA	BSCS
25-106608	CHARLICE JADE FUENSALIDA MARJALINO	BSCS
25-110661	JANMAR MENIOLA MATAVERDE	BSCS
25-105534	JYRA CORRO MONTICALVO	BSCS
25-198530	CLARENCE GAYTOS MORILLA	BSCS
25-199926	JASMIN HALCON ORTIZ	BSCS
25-101690	ESROM GURAY PANELO	BSCS
25-101894	TRISTAN FLOYD AGNOTE PARANGAT	BSCS
25-100392	RONALD CAMPOSANO PIMENTEL	BSCS
25-199603	ALLIESSA MAE DESUYO REBOSURA	BSCS
25-197220	SUMMER ROSE RESUS RODRIGO	BSCS
25-197149	DESERIE RODRIGUEZ	BSCS
25-105541	SHANNE MADELEINE MORALES SABA	BSCS
25-111833	JOHN PRENZ BORROMEO SACAPAÑO	BSCS
25-107491	JOHN MARINE PRETISTA SALVADOR	BSCS
25-107571	AARON VICTORIOUS SANDOY SAMSON	BSCS
25-105662	CIELO GARAIS TAGLOCOP	BSCS
`.trim();

const UploadMembers = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");

  const parseMembersData = () => {
    const lines = membersData.split('\n').filter(line => line.trim());
    return lines.map(line => {
      const parts = line.split('\t');
      return {
        school_id: parts[0].trim(),
        name: parts[1].trim(),
        program: parts[2].trim() as "BSCS" | "BSIT" | "BSIS" | "BTVTED-CSS",
        block: "" // Leave blank as requested
      };
    });
  };

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
