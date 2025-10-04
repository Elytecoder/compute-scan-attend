import { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

const Scanner = () => {
  const [scanner, setScanner] = useState<Html5QrcodeScanner | null>(null);
  const [scanning, setScanning] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [events, setEvents] = useState<any[]>([]);
  const [lastScan, setLastScan] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

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

    const html5QrcodeScanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    setScanner(html5QrcodeScanner);
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
    const schoolId = decodedText.trim();
    
    // Find member by school ID
    const { data: member, error: memberError } = await supabase
      .from("members")
      .select("*")
      .eq("school_id", schoolId)
      .single();

    if (memberError || !member) {
      setLastScan({
        success: false,
        message: `Member not found: ${schoolId}`,
      });
      toast.error("Member not found in the system");
      return;
    }

    // Check if already checked in
    const { data: existingAttendance } = await supabase
      .from("attendance")
      .select("*")
      .eq("event_id", selectedEvent)
      .eq("member_id", member.id)
      .is("time_out", null)
      .single();

    if (existingAttendance) {
      // Time out
      const { error: updateError } = await supabase
        .from("attendance")
        .update({ time_out: new Date().toISOString() })
        .eq("id", existingAttendance.id);

      if (updateError) {
        toast.error("Failed to record time out");
        return;
      }

      setLastScan({
        success: true,
        message: `${member.name} - TIMED OUT`,
      });
      toast.success(`${member.name} timed out successfully`);
    } else {
      // Time in
      const { error: insertError } = await supabase
        .from("attendance")
        .insert({
          event_id: selectedEvent,
          member_id: member.id,
          time_in: new Date().toISOString(),
        });

      if (insertError) {
        toast.error("Failed to record attendance");
        return;
      }

      setLastScan({
        success: true,
        message: `${member.name} - TIMED IN\n${member.program} ${member.block}`,
      });
      toast.success(`${member.name} checked in successfully`);
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
          <CardTitle>Select Event</CardTitle>
          <CardDescription>Choose the event to record attendance for</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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

          {!scanning ? (
            <Button onClick={startScanning} className="w-full" disabled={!selectedEvent}>
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
