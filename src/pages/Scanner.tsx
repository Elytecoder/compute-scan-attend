import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { z } from "zod";

// Validation schema for school ID
const schoolIdSchema = z.string()
  .trim()
  .regex(/^\d{4}-\d{5}$/, "Invalid school ID format")
  .max(20, "School ID is too long");

const Scanner = () => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<"morning" | "afternoon">("morning");
  const [actionType, setActionType] = useState<"time_in" | "time_out">("time_in");
  const [events, setEvents] = useState<any[]>([]);
  const [lastScan, setLastScan] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (scanning && !scanner) {
      // Wait for DOM to update before initializing scanner
      const timer = setTimeout(() => {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          "reader",
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
        setScanner(html5QrcodeScanner);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [scanning, scanner]);

  useEffect(() => {
    return () => {
      if (scanner) {
        scanner.clear();
      }
    };
  }, [scanner]);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      toast.error("Failed to load events");
    } else {
      setEvents(data || []);
    }
  };

  const startScanning = () => {
    if (!selectedEvent) {
      toast.error("Please select an event first");
      return;
    }
    if (!selectedSession) {
      toast.error("Please select a session first");
      return;
    }
    if (!actionType) {
      toast.error("Please select an action type first");
      return;
    }
    setScanning(true);
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear();
      setScanner(null);
      setScanning(false);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    // Validate and sanitize school ID
    const validation = schoolIdSchema.safeParse(decodedText);
    if (!validation.success) {
      setLastScan({
        success: false,
        message: `Invalid QR code format: ${decodedText}`,
      });
      toast.error("Invalid QR code format. Please scan a valid membership card.");
      return;
    }
    
    const schoolId = validation.data;
    
    // Find member by school ID
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("school_id", schoolId)
      .maybeSingle();

    if (memberError || !member) {
      setLastScan({
        success: false,
        message: `Member not found: ${schoolId}`,
      });
      toast.error("Member not found in the system");
      return;
    }

    if (actionType === "time_in") {
      // Check if already has a time in for this session
      const { data: existingTimeIn } = await supabase
        .from("attendance")
        .select("*")
        .eq("event_id", selectedEvent)
        .eq("member_id", member.id)
        .eq("session", selectedSession)
        .maybeSingle();

      if (existingTimeIn) {
        setLastScan({
          success: false,
          message: `${member.name} - Already has time in for ${selectedSession} session`,
        });
        toast.error(`${member.name} already has a time in record for the ${selectedSession} session`);
        return;
      }

      // Record time in
      const { error: insertError } = await supabase
        .from("attendance")
        .insert({
          event_id: selectedEvent,
          member_id: member.id,
          session: selectedSession,
          time_in: new Date().toISOString(),
        });

      if (insertError) {
        toast.error("Failed to record time in. Please try again.");
        return;
      }

      setLastScan({
        success: true,
        message: `${member.name} - TIMED IN (${selectedSession.toUpperCase()})\n${member.program} ${member.block}`,
      });
      toast.success(`${member.name} timed in successfully for ${selectedSession}`);
    } else {
      // Time out - find existing time in record without time out
      const { data: existingAttendance } = await supabase
        .from("attendance")
        .select("*")
        .eq("event_id", selectedEvent)
        .eq("member_id", member.id)
        .eq("session", selectedSession)
        .maybeSingle();

      if (!existingAttendance) {
        setLastScan({
          success: false,
          message: `${member.name} - No time in record found for ${selectedSession} session`,
        });
        toast.error(`${member.name} has no time in record for the ${selectedSession} session`);
        return;
      }

      if (existingAttendance.time_out) {
        setLastScan({
          success: false,
          message: `${member.name} - Already timed out for ${selectedSession} session`,
        });
        toast.error(`${member.name} already has a time out record for the ${selectedSession} session`);
        return;
      }

      // Record time out
      const { error: updateError } = await supabase
        .from("attendance")
        .update({ time_out: new Date().toISOString() })
        .eq("id", existingAttendance.id);

      if (updateError) {
        toast.error("Failed to record time out. Please try again.");
        return;
      }

      setLastScan({
        success: true,
        message: `${member.name} - TIMED OUT (${selectedSession.toUpperCase()})`,
      });
      toast.success(`${member.name} timed out successfully for ${selectedSession}`);
    }
  };

  const onScanFailure = (error: any) => {
    // Ignore scan failures - they happen constantly as the scanner tries to read
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Attendance</h1>
        <p className="text-muted-foreground">Scan membership cards to record attendance</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event, Session & Action</CardTitle>
          <CardDescription>Choose the event, session, and whether to record time in or time out</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Event</label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent} disabled={scanning}>
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
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Session</label>
            <Select value={selectedSession} onValueChange={(value: "morning" | "afternoon") => setSelectedSession(value)} disabled={scanning}>
              <SelectTrigger>
                <SelectValue placeholder="Select a session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Action Type</label>
            <Select value={actionType} onValueChange={(value: "time_in" | "time_out") => setActionType(value)} disabled={scanning}>
              <SelectTrigger>
                <SelectValue placeholder="Select action type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time_in">Time In</SelectItem>
                <SelectItem value="time_out">Time Out</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {!scanning ? (
            <Button onClick={startScanning} className="w-full" disabled={!selectedEvent || !selectedSession || !actionType}>
              Start Scanning
            </Button>
          ) : (
            <Button onClick={stopScanning} variant="destructive" className="w-full">
              Stop Scanning
            </Button>
          )}
        </CardContent>
      </Card>

      {lastScan && (
        <Card className={lastScan.success ? "border-green-500" : "border-red-500"}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {lastScan.success ? (
                <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0 mt-1" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <p className="font-medium whitespace-pre-line">{lastScan.message}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {scanning && (
        <Card>
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
            <CardDescription>Position the barcode within the frame</CardDescription>
          </CardHeader>
          <CardContent>
            <div id="reader" className="w-full"></div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scanner;
