import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const Reports = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const [summaryByProgram, setSummaryByProgram] = useState<any[]>([]);
  const [summaryByBlock, setSummaryByBlock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
              <CardTitle>Detailed Attendance</CardTitle>
              <CardDescription>
                {attendanceData.length} total attendees
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attendanceData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No attendance records for this event yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Program</TableHead>
                      <TableHead>Block</TableHead>
                      <TableHead>Time In</TableHead>
                      <TableHead>Time Out</TableHead>
                      <TableHead>Duration</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.member.school_id}
                        </TableCell>
                        <TableCell>{record.member.name}</TableCell>
                        <TableCell>{record.member.program}</TableCell>
                        <TableCell>{record.member.block}</TableCell>
                        <TableCell>{formatTime(record.time_in)}</TableCell>
                        <TableCell>{formatTime(record.time_out)}</TableCell>
                        <TableCell>
                          {calculateDuration(record.time_in, record.time_out)}
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
    </div>
  );
};

export default Reports;
