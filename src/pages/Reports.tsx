import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, Trash2 } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Reports = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [summaryByProgram, setSummaryByProgram] = useState<any[]>([]);
  const [summaryByBlock, setSummaryByBlock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProgram, setSelectedProgram] = useState<string>("all");
  const [selectedBlock, setSelectedBlock] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<any>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchAttendanceData();
    }
  }, [selectedEvent]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      toast.error("Failed to load events");
    } else {
      setEvents(data || []);
      if (data && data.length > 0) {
        setSelectedEvent(data[0].id);
      }
    }
    setLoading(false);
  };

  const fetchAttendanceData = async () => {
    setLoading(true);
    
    const { data, error } = await supabase
      .from("attendance")
      .select(`
        *,
        member:members (
          school_id,
          name,
          program,
          block
        )
      `)
      .eq("event_id", selectedEvent)
      .order("time_in", { ascending: false });

    if (error) {
      toast.error("Failed to load attendance data");
      setLoading(false);
      return;
    }

    setAttendanceData(data || []);

    // Calculate summaries
    const programCounts: { [key: string]: number } = {};
    const blockCounts: { [key: string]: number } = {};

    data?.forEach((record: any) => {
      const program = record.member.program;
      const block = record.member.block;
      
      programCounts[program] = (programCounts[program] || 0) + 1;
      blockCounts[block] = (blockCounts[block] || 0) + 1;
    });

    setSummaryByProgram(
      Object.entries(programCounts).map(([program, count]) => ({
        program,
        count,
      }))
    );

    setSummaryByBlock(
      Object.entries(blockCounts).map(([block, count]) => ({
        block,
        count,
      }))
    );

    setLoading(false);
  };

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return "-";
    return new Date(timestamp).toLocaleTimeString();
  };

  const calculateDuration = (timeIn: string, timeOut: string | null) => {
    if (!timeOut) return "-";
    const duration = new Date(timeOut).getTime() - new Date(timeIn).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Get unique programs and blocks
  const uniquePrograms = useMemo(() => {
    const programs = new Set(attendanceData.map(record => record.member.program));
    return Array.from(programs).sort();
  }, [attendanceData]);

  const uniqueBlocks = useMemo(() => {
    const blocks = new Set(attendanceData.map(record => record.member.block));
    return Array.from(blocks).sort();
  }, [attendanceData]);

  // Filter attendance data based on selected program and block
  const filteredAttendanceData = useMemo(() => {
    return attendanceData.filter(record => {
      const programMatch = selectedProgram === "all" || record.member.program === selectedProgram;
      const blockMatch = selectedBlock === "all" || record.member.block === selectedBlock;
      return programMatch && blockMatch;
    });
  }, [attendanceData, selectedProgram, selectedBlock]);

  const handleDeleteAttendance = async () => {
    if (!attendanceToDelete) return;

    const { error } = await supabase
      .from("attendance")
      .delete()
      .eq("id", attendanceToDelete.id);

    if (error) {
      toast.error("Failed to delete attendance record");
    } else {
      toast.success("Attendance record deleted successfully");
      setDeleteDialogOpen(false);
      setAttendanceToDelete(null);
      if (selectedEvent) {
        fetchAttendanceData();
      }
    }
  };

  const openDeleteDialog = (attendance: any) => {
    setAttendanceToDelete(attendance);
    setDeleteDialogOpen(true);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const selectedEventData = events.find(e => e.id === selectedEvent);
    
    // Add title
    doc.setFontSize(16);
    doc.text("Attendance Report", 14, 15);
    
    // Add event details
    doc.setFontSize(10);
    doc.text(`Event: ${selectedEventData?.name || 'N/A'}`, 14, 25);
    doc.text(`Date: ${selectedEventData ? new Date(selectedEventData.event_date).toLocaleDateString() : 'N/A'}`, 14, 30);
    if (selectedProgram !== "all") {
      doc.text(`Program: ${selectedProgram}`, 14, 35);
    }
    if (selectedBlock !== "all") {
      doc.text(`Block: ${selectedBlock}`, 14, selectedProgram !== "all" ? 40 : 35);
    }
    
    // Prepare table data
    const tableData = filteredAttendanceData.map(record => [
      record.member.school_id,
      record.member.name,
      record.member.program,
      record.member.block,
      record.session,
      formatTime(record.time_in),
      formatTime(record.time_out),
      calculateDuration(record.time_in, record.time_out)
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['School ID', 'Name', 'Program', 'Block', 'Session', 'Time In', 'Time Out', 'Duration']],
      body: tableData,
      startY: selectedProgram !== "all" && selectedBlock !== "all" ? 45 : selectedProgram !== "all" || selectedBlock !== "all" ? 40 : 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [128, 0, 32] }
    });
    
    // Save the PDF
    const filename = `attendance_${selectedEventData?.name || 'report'}_${selectedProgram !== "all" ? selectedProgram + "_" : ""}${selectedBlock !== "all" ? selectedBlock + "_" : ""}${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
    toast.success("Report exported successfully");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">View attendance reports and analytics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose an event to view its attendance report</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger>
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name} - {new Date(event.event_date).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!loading && selectedEvent && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Filter by Program and Block</CardTitle>
              <CardDescription>Select specific program and/or block to view</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Program/Course</label>
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Programs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Programs</SelectItem>
                      {uniquePrograms.map((program) => (
                        <SelectItem key={program} value={program}>
                          {program}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Block</label>
                  <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Blocks" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Blocks</SelectItem>
                      {uniqueBlocks.map((block) => (
                        <SelectItem key={block} value={block}>
                          {block}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Attendance by Program</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summaryByProgram}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="program" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Attendance by Block</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={summaryByBlock}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="block" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="hsl(var(--secondary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Detailed Attendance</CardTitle>
                  <CardDescription>
                    {filteredAttendanceData.length} attendees {selectedProgram !== "all" || selectedBlock !== "all" ? "(filtered)" : "(total)"}
                  </CardDescription>
                </div>
                <Button onClick={exportToPDF} disabled={filteredAttendanceData.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Export to PDF
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredAttendanceData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {attendanceData.length === 0 
                    ? "No attendance records for this event yet."
                    : "No attendance records match the selected filters."}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAttendanceData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.member.school_id}
                        </TableCell>
                        <TableCell>{record.member.name}</TableCell>
                        <TableCell>{record.member.program}</TableCell>
                        <TableCell>{record.member.block}</TableCell>
                        <TableCell className="capitalize">{record.session}</TableCell>
                        <TableCell>{formatTime(record.time_in)}</TableCell>
                        <TableCell>{formatTime(record.time_out)}</TableCell>
                        <TableCell>
                          {calculateDuration(record.time_in, record.time_out)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(record)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attendance Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this attendance record for {attendanceToDelete?.member?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAttendance}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Reports;
