import { useEffect, useMemo, useRef, useState } from "react";
import {
  CameraDevice,
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, RefreshCw, XCircle } from "lucide-react";
import { z } from "zod";

// Validation schema for school ID - accepts both QR format and barcode format (alphanumeric)
const schoolIdSchema = z
  .string()
  .trim()
  .min(1, "School ID cannot be empty")
  .max(20, "School ID is too long");

const SUPPORTED_FORMATS: Html5QrcodeSupportedFormats[] = [
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.CODE_39,
  // Common 1D barcode types (in case cards are not Code 39)
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.ITF,
];

const Scanner = () => {
  const qrRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);

  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<"morning" | "afternoon">(
    "morning"
  );
  const [actionType, setActionType] = useState<"time_in" | "time_out">("time_in");
  const [events, setEvents] = useState<any[]>([]);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [activeCameraIndex, setActiveCameraIndex] = useState(0);

  const [lastScan, setLastScan] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const activeCamera = useMemo(() => {
    if (!cameras.length) return null;
    return cameras[Math.min(activeCameraIndex, cameras.length - 1)] ?? null;
  }, [cameras, activeCameraIndex]);

  useEffect(() => {
    fetchEvents();
  }, []);

  // Start (or restart) the camera stream when scanning is enabled or when camera changes.
  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    const ensureCameraList = async () => {
      if (cameras.length) return;
      try {
        const devices = await Html5Qrcode.getCameras();
        if (cancelled) return;

        if (!devices.length) {
          toast.error("No camera detected on this device");
          setScanning(false);
          return;
        }

        setCameras(devices);
        // Prefer the last camera (often the rear/environment camera on phones)
        setActiveCameraIndex(devices.length > 1 ? devices.length - 1 : 0);
      } catch (err) {
        console.error("Failed to list cameras", err);
        toast.error("Unable to access cameras. Please allow camera permission.");
        setScanning(false);
      }
    };

    const startWithActiveCamera = async () => {
      // Wait until cameras are loaded
      if (!activeCamera) return;

      setStarting(true);
      try {
        if (!qrRef.current) {
          qrRef.current = new Html5Qrcode("reader", {
            verbose: false,
            formatsToSupport: SUPPORTED_FORMATS,
            useBarCodeDetectorIfSupported: true,
            experimentalFeatures: {
              useBarCodeDetectorIfSupported: true,
            },
          });
        }

        const qr = qrRef.current;

        if (qr.isScanning) {
          await qr.stop().catch(() => {
            // ignore stop errors during quick restarts
          });
        }

        qr.clear();

        await qr.start(
          activeCamera.id,
          {
            fps: 12,
            // A rectangular scan zone tends to work better for 1D barcodes,
            // while still being usable for QR codes.
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
              const width = Math.floor(minEdgeSize * 0.9);
              const height = Math.floor(minEdgeSize * 0.45);
              return { width, height };
            },
          },
          (decodedText) => {
            void onScanSuccess(decodedText);
          },
          () => {
            // Ignore scan failures - they happen constantly as the scanner tries to read
          }
        );
      } catch (err: any) {
        console.error("Failed to start scanner", err);
        toast.error(
          err?.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access and try again."
            : "Camera failed to start. Please try again."
        );
        setScanning(false);
      } finally {
        setStarting(false);
      }
    };

    // Defer until the reader div is in the DOM.
    const timer = window.setTimeout(() => {
      void (async () => {
        await ensureCameraList();
        if (cancelled) return;
        await startWithActiveCamera();
      })();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [scanning, activeCamera, cameras.length]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const qr = qrRef.current;
      if (!qr) return;
      qr.stop()
        .catch(() => undefined)
        .finally(() => {
          try {
            qr.clear();
          } catch {
            // ignore
          }
        });
    };
  }, []);

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

    setLastScan(null);
    setScanning(true);
  };

  const stopScanning = async () => {
    const qr = qrRef.current;

    try {
      if (qr?.isScanning) {
        await qr.stop();
      }
      qr?.clear();
    } catch (err) {
      console.error("Failed to stop scanner", err);
    } finally {
      setScanning(false);
    }
  };

  const switchCamera = () => {
    if (cameras.length <= 1) return;
    setActiveCameraIndex((idx) => (idx + 1) % cameras.length);
  };

  const playBeep = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const onScanSuccess = async (decodedText: string) => {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      console.log("Scanned value:", decodedText);

      const validation = schoolIdSchema.safeParse(decodedText);
      if (!validation.success) {
        setLastScan({
          success: false,
          message: `Invalid barcode format: ${decodedText}`,
        });
        toast.error("Invalid barcode format. Please scan a valid membership card.");
        return;
      }

      const schoolId = validation.data;

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
          toast.error(
            `${member.name} already has a time in record for the ${selectedSession} session`
          );
          return;
        }

        const { error: insertError } = await supabase.from("attendance").insert({
          event_id: selectedEvent,
          member_id: member.id,
          session: selectedSession,
          time_in: new Date().toISOString(),
        });

        if (insertError) {
          toast.error("Failed to record time in. Please try again.");
          return;
        }

        playBeep();
        setLastScan({
          success: true,
          message: `${member.name} - TIMED IN (${selectedSession.toUpperCase()})\n${member.program} ${member.block}`,
        });
        toast.success(`${member.name} timed in successfully for ${selectedSession}`);
      } else {
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
          toast.error(
            `${member.name} has no time in record for the ${selectedSession} session`
          );
          return;
        }

        if (existingAttendance.time_out) {
          setLastScan({
            success: false,
            message: `${member.name} - Already timed out for ${selectedSession} session`,
          });
          toast.error(
            `${member.name} already has a time out record for the ${selectedSession} session`
          );
          return;
        }

        const { error: updateError } = await supabase
          .from("attendance")
          .update({ time_out: new Date().toISOString() })
          .eq("id", existingAttendance.id);

        if (updateError) {
          toast.error("Failed to record time out. Please try again.");
          return;
        }

        playBeep();
        setLastScan({
          success: true,
          message: `${member.name} - TIMED OUT (${selectedSession.toUpperCase()})`,
        });
        toast.success(`${member.name} timed out successfully for ${selectedSession}`);
      }
    } finally {
      // Small cooldown to avoid multiple rapid triggers on the same code.
      window.setTimeout(() => {
        processingRef.current = false;
      }, 900);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Scan Attendance</h1>
        <p className="text-muted-foreground">
          Scan membership cards to record attendance
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Event, Session & Action</CardTitle>
          <CardDescription>
            Choose the event, session, and whether to record time in or time out
          </CardDescription>
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
            <Select
              value={selectedSession}
              onValueChange={(value: "morning" | "afternoon") => setSelectedSession(value)}
              disabled={scanning}
            >
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
            <Select
              value={actionType}
              onValueChange={(value: "time_in" | "time_out") => setActionType(value)}
              disabled={scanning}
            >
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
            <Button
              onClick={startScanning}
              className="w-full"
              disabled={!selectedEvent || !selectedSession || !actionType}
            >
              Start Scanning
            </Button>
          ) : (
            <Button onClick={() => void stopScanning()} variant="destructive" className="w-full">
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
            <CardDescription>
              Position the barcode within the frame{activeCamera?.label ? ` • ${activeCamera.label}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={switchCamera}
                disabled={starting || cameras.length <= 1}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Switch Camera
              </Button>
              {starting && (
                <p className="text-sm text-muted-foreground">Starting camera…</p>
              )}
            </div>

            <div id="reader" className="w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Scanner;
