"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Phone,
  PhoneIncoming,
  PhoneOff,
  Clock,
  Calendar,
  CheckCircle,
  Globe,
  Settings,
  BarChart3,
  ArrowLeft,
  Loader2,
  Mic,
  MicOff,
  MessageSquare,
  Send,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { Device, Call } from "@twilio/voice-sdk";

interface CallLog {
  id: string;
  phoneNumber: string;
  duration: number;
  language: string;
  outcome: string;
  appointmentBooked: boolean;
  createdAt: string;
  transcript?: string;
}

interface VoiceStats {
  totalCalls: number;
  successfulBookings: number;
  averageDuration: number;
  languageBreakdown: Record<string, number>;
}

export default function VoiceReceptionistPage() {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(true);
  const [calls, setCalls] = useState<CallLog[]>([]);
  const [stats, setStats] = useState<VoiceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCall, setSelectedCall] = useState<CallLog | null>(null);
  const [twilioPhoneNumber, setTwilioPhoneNumber] = useState("");

  // Twilio Voice SDK state
  const [device, setDevice] = useState<Device | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [callStatus, setCallStatus] = useState<string>("idle");
  const [isMuted, setIsMuted] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [callError, setCallError] = useState<string | null>(null);

  // SMS state
  const [showSmsInput, setShowSmsInput] = useState(false);
  const [smsMessage, setSmsMessage] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);
  const [smsSuccess, setSmsSuccess] = useState(false);
  const [smsError, setSmsError] = useState<string | null>(null);

  // Initialize Twilio Device
  const initializeDevice = useCallback(async () => {
    if (device) return device;

    setIsInitializing(true);
    setCallError(null);

    try {
      console.log("[Voice] Fetching access token...");
      const response = await fetch("/api/voice/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identity: `user-${Date.now()}` }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get access token");
      }

      const { token } = await response.json();
      console.log("[Voice] Access token received, initializing device...");

      const newDevice = new Device(token, {
        logLevel: 1,
        codecPreferences: [Call.Codec.Opus, Call.Codec.PCMU],
      });

      newDevice.on("registered", () => {
        console.log("[Voice] Device registered successfully");
        setCallStatus("ready");
      });

      newDevice.on("error", (error) => {
        console.error("[Voice] Device error:", error);
        setCallError(error.message);
        setCallStatus("error");
      });

      await newDevice.register();
      setDevice(newDevice);
      setIsInitializing(false);
      console.log("[Voice] Device initialized and registered");
      return newDevice;
    } catch (error) {
      console.error("[Voice] Failed to initialize device:", error);
      setCallError(error instanceof Error ? error.message : "Failed to initialize");
      setCallStatus("error");
      setIsInitializing(false);
      return null;
    }
  }, [device]);

  // Make outgoing call from browser
  const makeCall = async () => {
    setCallError(null);

    let currentDevice = device;
    if (!currentDevice) {
      currentDevice = await initializeDevice();
      if (!currentDevice) return;
    }

    try {
      setCallStatus("connecting");
      console.log("[Voice] Making call from browser...");

      const call = await currentDevice.connect({
        params: {
          To: twilioPhoneNumber,
        },
      });

      call.on("accept", () => {
        console.log("[Voice] Call accepted");
        setCallStatus("connected");
      });

      call.on("disconnect", () => {
        console.log("[Voice] Call disconnected");
        setCallStatus("ready");
        setActiveCall(null);
        setIsMuted(false);
      });

      call.on("error", (error) => {
        console.error("[Voice] Call error:", error);
        setCallError(error.message);
        setCallStatus("error");
        setActiveCall(null);
      });

      setActiveCall(call);
    } catch (error) {
      console.error("[Voice] Failed to make call:", error);
      setCallError(error instanceof Error ? error.message : "Failed to make call");
      setCallStatus("error");
    }
  };

  // Toggle mute
  const toggleMute = () => {
    if (activeCall) {
      activeCall.mute(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  // Hang up call
  const hangUp = () => {
    if (activeCall) {
      activeCall.disconnect();
      setActiveCall(null);
      setCallStatus("ready");
      setIsMuted(false);
    }
  };

  // Send SMS via Twilio
  const sendSms = async () => {
    if (!smsMessage.trim() || !twilioPhoneNumber) return;

    setIsSendingSms(true);
    setSmsError(null);
    setSmsSuccess(false);

    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: twilioPhoneNumber,
          message: smsMessage,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send SMS");
      }

      setSmsSuccess(true);
      setSmsMessage("");
      setTimeout(() => {
        setSmsSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("[SMS] Failed to send:", error);
      setSmsError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setIsSendingSms(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchPhoneNumber();
  }, []);

  const fetchPhoneNumber = async () => {
    try {
      const response = await fetch("/api/voice/status");
      if (response.ok) {
        const data = await response.json();
        setTwilioPhoneNumber(data.phoneNumber || "");
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    // Simulated data - in production, fetch from API
    setCalls([
      {
        id: "1",
        phoneNumber: "+1 (555) 123-4567",
        duration: 145,
        language: "en",
        outcome: "BOOKED",
        appointmentBooked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        transcript: "AI: Thank you for calling Serenity Salon and Spa. How can I help you today?\nCaller: I'd like to book a haircut for tomorrow.\nAI: I'd be happy to help you book a haircut. Do you have a preferred time?...",
      },
      {
        id: "2",
        phoneNumber: "+1 (555) 987-6543",
        duration: 89,
        language: "es",
        outcome: "TRANSFERRED",
        appointmentBooked: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      },
      {
        id: "3",
        phoneNumber: "+1 (555) 456-7890",
        duration: 210,
        language: "vi",
        outcome: "BOOKED",
        appointmentBooked: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      },
    ]);

    setStats({
      totalCalls: 156,
      successfulBookings: 89,
      averageDuration: 120,
      languageBreakdown: { en: 78, es: 35, vi: 28, ko: 10, zh: 5 },
    });
    setIsLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getLanguageName = (code: string) => {
    const names: Record<string, string> = {
      en: "English",
      es: "Spanish",
      vi: "Vietnamese",
      ko: "Korean",
      zh: "Chinese",
    };
    return names[code] || code;
  };

  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case "BOOKED":
        return "bg-green-100 text-green-800";
      case "TRANSFERRED":
        return "bg-blue-100 text-blue-800";
      case "VOICEMAIL":
        return "bg-amber-100 text-amber-800";
      case "FAILED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Voice Receptionist</h1>
            <p className="text-muted-foreground">
              24/7 automated phone booking powered by Twilio
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            <Label>{isEnabled ? "Active" : "Disabled"}</Label>
          </div>
          <Button variant="outline" onClick={() => router.push("/ai/voice/settings")}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Call Now Card */}
      <Card className={`mb-6 ${callStatus === "connected" ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${callStatus === "connected" ? "bg-red-100" : "bg-green-100"}`}>
                {callStatus === "connected" ? (
                  <Phone className="h-8 w-8 text-red-600 animate-pulse" />
                ) : (
                  <Phone className="h-8 w-8 text-green-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold">
                  {callStatus === "connected" ? "Call in Progress" : "Test AI Receptionist"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {callStatus === "idle" && "Click to call the AI receptionist from your browser"}
                  {callStatus === "connecting" && "Connecting..."}
                  {callStatus === "connected" && "Speaking with AI receptionist - use your microphone"}
                  {callStatus === "ready" && "Ready to call"}
                  {callStatus === "error" && (callError || "Connection error")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {callStatus === "connected" && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={toggleMute}
                    className={isMuted ? "bg-amber-100 border-amber-300" : ""}
                  >
                    {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                  </Button>
                  <Button
                    size="lg"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={hangUp}
                  >
                    <PhoneOff className="h-5 w-5 mr-2" />
                    End Call
                  </Button>
                </>
              )}
              {callStatus !== "connected" && (
                <>
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-blue-300 text-blue-600 hover:bg-blue-50"
                    onClick={() => router.push("/ai/sms-chat")}
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Text Us
                  </Button>
                  <Button
                    size="lg"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={makeCall}
                    disabled={isInitializing || callStatus === "connecting"}
                  >
                    {isInitializing || callStatus === "connecting" ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        {isInitializing ? "Initializing..." : "Connecting..."}
                      </>
                    ) : (
                      <>
                        <Phone className="h-5 w-5 mr-2" />
                        Call Now
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
          {callError && (
            <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">
              <strong>Error:</strong> {callError}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Phone className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.totalCalls || 0}</div>
                <div className="text-sm text-muted-foreground">Total Calls</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats?.successfulBookings || 0}</div>
                <div className="text-sm text-muted-foreground">Bookings Made</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {formatDuration(stats?.averageDuration || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Avg Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats ? Math.round((stats.successfulBookings / stats.totalCalls) * 100) : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Call Logs */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
            <CardDescription>Calls handled by the AI voice receptionist</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12 text-muted-foreground">Loading calls...</div>
            ) : calls.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No calls yet</p>
                <p className="text-sm mt-2">Configure Twilio above to start receiving calls</p>
              </div>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => (
                  <div
                    key={call.id}
                    className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedCall?.id === call.id ? "border-rose-500 bg-rose-50" : ""
                    }`}
                    onClick={() => setSelectedCall(call)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-full">
                        <PhoneIncoming className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{call.phoneNumber}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {getLanguageName(call.language)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDuration(call.duration)}
                          </span>
                          <span>{formatDistanceToNow(new Date(call.createdAt))} ago</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {call.appointmentBooked && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      <Badge className={getOutcomeColor(call.outcome)}>{call.outcome}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Language Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Language Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {stats?.languageBreakdown && (
                <div className="space-y-3">
                  {Object.entries(stats.languageBreakdown)
                    .sort((a, b) => b[1] - a[1])
                    .map(([lang, count]) => (
                      <div key={lang} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <span>{getLanguageName(lang)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500"
                              style={{
                                width: `${(count / stats.totalCalls) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-sm text-muted-foreground w-8">{count}</span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Call Transcript */}
          {selectedCall && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Call Transcript</CardTitle>
                <CardDescription>{selectedCall.phoneNumber}</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedCall.transcript ? (
                  <div className="text-sm whitespace-pre-wrap bg-muted p-4 rounded-lg max-h-[300px] overflow-y-auto">
                    {selectedCall.transcript}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No transcript available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Business Hours Only</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Allow Voicemail</Label>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label>Transfer to Human</Label>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label>Default Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="vi">Vietnamese</SelectItem>
                    <SelectItem value="ko">Korean</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
