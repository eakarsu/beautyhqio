"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  RefreshCw,
  MessageCircle,
  TrendingUp,
  Clock,
  UserCheck,
} from "lucide-react";

interface Suggestion {
  type: "upsell" | "rebook" | "waitlist" | "reminder";
  appointmentId?: string | null;
  title: string;
  rationale: string;
  action: string;
}

const ICONS: Record<string, any> = {
  upsell: TrendingUp,
  rebook: RefreshCw,
  waitlist: UserCheck,
  reminder: Clock,
};

const COLORS: Record<string, string> = {
  upsell: "bg-emerald-100 text-emerald-700",
  rebook: "bg-amber-100 text-amber-700",
  waitlist: "bg-purple-100 text-purple-700",
  reminder: "bg-blue-100 text-blue-700",
};

export default function CopilotPage() {
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/front-desk-copilot", {
        cache: "no-store",
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || `HTTP ${res.status}`);
      }
      const json = await res.json();
      setItems(json.suggestions || []);
      setUpdatedAt(json.generatedAt || new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000); // 30s poll
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Front-Desk Copilot
          </h1>
          <p className="text-sm text-muted-foreground">
            Live AI suggestions for the next 6 hours.{" "}
            {updatedAt && (
              <span>Updated: {new Date(updatedAt).toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <Button onClick={refresh} disabled={loading} variant="outline">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      {error && (
        <Card className="border-red-200">
          <CardContent className="p-4 text-red-600 text-sm">
            {error}
          </CardContent>
        </Card>
      )}

      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No suggestions right now. Looking good!
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((s, i) => {
          const Icon = ICONS[s.type] || MessageCircle;
          const color = COLORS[s.type] || "bg-gray-100 text-gray-700";
          return (
            <Card key={i}>
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
                <div className="flex items-center gap-2">
                  <span className={`p-2 rounded-md ${color}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <CardTitle className="text-base">{s.title}</CardTitle>
                </div>
                <Badge variant="outline">{s.type}</Badge>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="text-muted-foreground">{s.rationale}</div>
                <div className="font-medium">→ {s.action}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
