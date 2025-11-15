import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { parseExcelStudents, StudentRecord } from "@/utils/parseExcelStudents";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, FileSpreadsheet, Database, AlertCircle, CheckCircle2, XCircle, Upload } from "lucide-react";

interface ComparisonStats {
  excelTotal: number;
  databaseTotal: number;
  newStudents: number;
  existingStudents: number;
  missingFromExcel: number;
}

const ComparisonReport = () => {
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [excelStudents, setExcelStudents] = useState<StudentRecord[]>([]);
  const [dbStudents, setDbStudents] = useState<any[]>([]);
  const [stats, setStats] = useState<ComparisonStats | null>(null);
  const [newStudentsList, setNewStudentsList] = useState<StudentRecord[]>([]);
  const [missingStudentsList, setMissingStudentsList] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load Excel data
      const excelData = await parseExcelStudents('/src/data/List_of_CICT_1-2.xlsx');
      setExcelStudents(excelData);

      // Load database data
      const { data: dbData, error } = await supabase
        .from('members')
        .select('*');

      if (error) throw error;
      setDbStudents(dbData || []);

      // Calculate comparison stats
      const excelIds = new Set(excelData.map(s => s.school_id));
      const dbIds = new Set(dbData?.map((s: any) => s.school_id) || []);

      const newStudents = excelData.filter(s => !dbIds.has(s.school_id));
      const missingFromExcel = dbData?.filter((s: any) => !excelIds.has(s.school_id)) || [];

      setNewStudentsList(newStudents);
      setMissingStudentsList(missingFromExcel);

      setStats({
        excelTotal: excelData.length,
        databaseTotal: dbData?.length || 0,
        newStudents: newStudents.length,
        existingStudents: excelData.filter(s => dbIds.has(s.school_id)).length,
        missingFromExcel: missingFromExcel.length
      });
    } catch (error) {
      console.error('Error loading comparison data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportNewStudents = async () => {
    if (newStudentsList.length === 0) {
      toast.info("No new students to import");
      return;
    }

    setImporting(true);
    setImportProgress(0);

    try {
      // Batch insert students in chunks of 50
      const batchSize = 50;
      let successCount = 0;
      
      for (let i = 0; i < newStudentsList.length; i += batchSize) {
        const batch = newStudentsList.slice(i, i + batchSize);
        
        const { data, error } = await supabase
          .from('members')
          .insert(batch)
          .select();

        if (error) {
          console.error('Error inserting batch:', error);
          toast.error(`Error importing batch: ${error.message}`);
        } else {
          successCount += data?.length || 0;
        }

        // Update progress
        setImportProgress(Math.round(((i + batch.length) / newStudentsList.length) * 100));
      }

      toast.success(`Successfully imported ${successCount} new students!`);
      
      // Reload data to refresh the comparison
      await loadData();
      
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setImporting(false);
      setImportProgress(0);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading comparison data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Excel vs Database Comparison</h1>
        <p className="text-muted-foreground">Compare student data from Excel file with database records</p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                Excel Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.excelTotal}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="h-4 w-4" />
                Database Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.databaseTotal}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                New Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{stats.newStudents}</div>
              <p className="text-xs text-muted-foreground">In Excel, not in DB</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Existing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{stats.existingStudents}</div>
              <p className="text-xs text-muted-foreground">In both sources</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                Missing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{stats.missingFromExcel}</div>
              <p className="text-xs text-muted-foreground">In DB, not in Excel</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Detailed Comparison</CardTitle>
          <CardDescription>View students in each category</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="new">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="new">
                New Students ({newStudentsList.length})
              </TabsTrigger>
              <TabsTrigger value="missing">
                Missing from Excel ({missingStudentsList.length})
              </TabsTrigger>
              <TabsTrigger value="breakdown">
                Program Breakdown
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Students found in Excel but not yet in the database
                </p>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {newStudentsList.map((student, index) => (
                      <div key={index} className="p-3 bg-background rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{student.school_id} - {student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.program} - Year {student.year_level}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                            New
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="missing" className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground mb-4">
                  Students in database but not found in the Excel file
                </p>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-2">
                    {missingStudentsList.map((student, index) => (
                      <div key={index} className="p-3 bg-background rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{student.school_id} - {student.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {student.program} - Year {student.year_level}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
                            Missing
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="breakdown" className="space-y-4">
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-3">Excel File Breakdown</h3>
                    {['BSCS', 'BSIT', 'BSIS', 'BTVTED-CSS'].map(program => {
                      const count = excelStudents.filter(s => s.program === program).length;
                      return count > 0 ? (
                        <div key={program} className="flex justify-between p-2 border-b">
                          <span>{program}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Database Breakdown</h3>
                    {['BSCS', 'BSIT', 'BSIS', 'BTVTED-CSS'].map(program => {
                      const count = dbStudents.filter(s => s.program === program).length;
                      return count > 0 ? (
                        <div key={program} className="flex justify-between p-2 border-b">
                          <span>{program}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {importing && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing students...</span>
                <span>{importProgress}%</span>
              </div>
              <Progress value={importProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button onClick={loadData} variant="outline" disabled={importing}>
          Refresh Data
        </Button>
        {stats && stats.newStudents > 0 && (
          <Button onClick={handleImportNewStudents} disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : `Import ${stats.newStudents} New Students`}
          </Button>
        )}
      </div>
    </div>
  );
};

export default ComparisonReport;
