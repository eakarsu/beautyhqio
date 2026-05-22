"use client";

/** Pass 7 — wearable integrations status page (backlog #4). */
import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProviderStatus {
  provider: string;
  configured?: boolean;
  connected?: boolean;
  required_env?: string[];
  missing?: string[];
  disclaimer?: string;
}

function ProviderCard({
  title,
  statusPath,
  connectPath,
  syncPath,
}: {
  title: string;
  statusPath: string;
  connectPath: string;
  syncPath: string;
}) {
  const [status, setStatus] = useState<ProviderStatus | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch(statusPath);
      const data = await res.json();
      setStatus(data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function tryConnect() {
    await fetch(connectPath, { method: "POST" });
    await refresh();
  }
  async function trySync() {
    await fetch(syncPath, { method: "POST" });
    await refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          {status && (
            <Badge variant={status.configured ? "default" : "destructive"}>
              {status.configured ? "Configured" : "Disabled (NEEDS-CREDS)"}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            {status?.disclaimer && (
              <p className="text-muted-foreground">{status.disclaimer}</p>
            )}
            {status?.missing && status.missing.length > 0 && (
              <p>
                Missing env vars:{" "}
                <code className="rounded bg-slate-100 px-1">
                  {status.missing.join(", ")}
                </code>
              </p>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={tryConnect}>
                Connect
              </Button>
              <Button size="sm" variant="secondary" onClick={trySync}>
                Sync
              </Button>
              <Button size="sm" variant="ghost" onClick={refresh}>
                Refresh
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function IntegrationsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Wearable Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Pass 7 — Apple Health + Fitbit are NEEDS-CREDS. Endpoints return 503
          stubs until OAuth credentials are provisioned in environment.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ProviderCard
          title="Apple Health"
          statusPath="/api/integrations/apple-health/status"
          connectPath="/api/integrations/apple-health/connect"
          syncPath="/api/integrations/apple-health/sync"
        />
        <ProviderCard
          title="Fitbit"
          statusPath="/api/integrations/fitbit/status"
          connectPath="/api/integrations/fitbit/connect"
          syncPath="/api/integrations/fitbit/sync"
        />
      </div>
    </div>
  );
}
