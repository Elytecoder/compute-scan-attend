import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { countStudentsFromExcel } from "@/utils/countExcelStudents";
import { Loader2 } from "lucide-react";

const CountStudents = () => {
  const [counting, setCounting] = useState(false);
  const [results, setResults] = useState<{
    totalStudents: number;
    sheetDetails: Array<{ sheetName: string; count: number; program: string; yearLevel: number }>;
  } | null>(null);

  const handleCount = async () => {
    setCounting(true);
    try {
      const data = await countStudentsFromExcel('/src/data/List_of_CICT_1-2.xlsx');
      setResults(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCounting(false);
    }
  };

  useEffect(() => {
    handleCount();
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Student Count from Excel</h1>
        <p className="text-muted-foreground">Counting students from List_of_CICT_1-2.xlsx</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Excel File Analysis</CardTitle>
          <CardDescription>
            Analyzing all sheets in the uploaded Excel file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {counting && (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Counting students...</span>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Total Students</p>
                <p className="text-5xl font-bold text-primary">{results.totalStudents}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Breakdown by Sheet:</h3>
                <div className="grid gap-2">
                  {results.sheetDetails.map((sheet, index) => (
                    <div key={index} className="p-4 bg-muted rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium">{sheet.sheetName}</p>
                        <p className="text-sm text-muted-foreground">
                          {sheet.program} - Year {sheet.yearLevel}
                        </p>
                      </div>
                      <p className="text-2xl font-bold">{sheet.count}</p>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleCount} className="w-full" disabled={counting}>
                Recount Students
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CountStudents;
