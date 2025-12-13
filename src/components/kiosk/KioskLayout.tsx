"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Scissors, RefreshCw, Home, Clock } from "lucide-react";
import { format } from "date-fns";

interface KioskLayoutProps {
  children: React.ReactNode;
  businessName?: string;
  showNav?: boolean;
  showTime?: boolean;
  idleTimeout?: number; // seconds
  onIdle?: () => void;
}

export function KioskLayout({
  children,
  businessName = "Beauty & Wellness",
  showNav = true,
  showTime = true,
  idleTimeout = 60,
  onIdle,
}: KioskLayoutProps) {
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastActivity, setLastActivity] = useState(Date.now());

  // Update clock every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Idle detection
  useEffect(() => {
    const handleActivity = () => {
      setLastActivity(Date.now());
    };

    const checkIdle = setInterval(() => {
      if (Date.now() - lastActivity > idleTimeout * 1000) {
        onIdle?.();
        router.push("/kiosk");
      }
    }, 1000);

    window.addEventListener("touchstart", handleActivity);
    window.addEventListener("mousemove", handleActivity);
    window.addEventListener("keydown", handleActivity);

    return () => {
      clearInterval(checkIdle);
      window.removeEventListener("touchstart", handleActivity);
      window.removeEventListener("mousemove", handleActivity);
      window.removeEventListener("keydown", handleActivity);
    };
  }, [lastActivity, idleTimeout, onIdle, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-rose-600 rounded-full flex items-center justify-center">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{businessName}</h1>
              <p className="text-sm text-muted-foreground">Self-Service Kiosk</p>
            </div>
          </div>

          {showTime && (
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-900">
                {format(currentTime, "h:mm")}
                <span className="text-lg ml-1">{format(currentTime, "a")}</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {format(currentTime, "EEEE, MMMM d")}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-8">{children}</main>

      {/* Footer Navigation */}
      {showNav && (
        <footer className="bg-white border-t px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => router.push("/kiosk")}
            >
              <Home className="h-5 w-5 mr-2" />
              Home
            </Button>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Touch to keep active
            </div>

            <Button
              variant="ghost"
              size="lg"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-5 w-5 mr-2" />
              Refresh
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
}
