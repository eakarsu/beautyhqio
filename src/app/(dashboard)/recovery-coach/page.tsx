"use client";

/** Pass 7 — recovery coach page (backlog #6). */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface Guidance {
  summary?: string;
  do_today?: string[];
  avoid_24h?: string[];
  warning_signs?: string[];
  followup_in_days?: number;
  products_to_consider?: string[];
}

interface Envelope {
  success?: boolean;
  ai_used?: boolean;
  guidance?: Guidance;
  disclaimer?: string;
  requires_human_review?: boolean;
}

export default function RecoveryCoachPage() {
  const [serviceName, setServiceName] = useState("");
  const [context, setContext] = useState("");
  const [sensitivities, setSensitivities] = useState("");
  const [skinType, setSkinType] = useState("");
  const [busy, setBusy] = useState(false);
  const [env, setEnv] = useState<Envelope | null>(null);

  async function ask() {
    setBusy(true);
    setEnv(null);
    try {
      const res = await fetch("/api/recovery-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceName,
          post_service_context: context,
          sensitivities,
          skinType,
        }),
      });
      const data = await res.json();
      setEnv(data);
    } finally {
      setBusy(false);
    }
  }

  const g = env?.guidance;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Recovery Coach</h1>
        <p className="text-sm text-muted-foreground">
          Post-service aftercare guidance. All output is advisory and{" "}
          <strong>requires human review</strong>.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Post-service context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Service</Label>
            <Input
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g. chemical peel"
            />
          </div>
          <div>
            <Label>Skin type</Label>
            <Input
              value={skinType}
              onChange={(e) => setSkinType(e.target.value)}
              placeholder="e.g. sensitive, oily"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Sensitivities</Label>
            <Input
              value={sensitivities}
              onChange={(e) => setSensitivities(e.target.value)}
              placeholder="e.g. fragrance, alcohol"
            />
          </div>
          <div className="md:col-span-2">
            <Label>Provider notes (post_service_context)</Label>
            <Textarea
              rows={4}
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="What the practitioner observed during/after the service"
            />
          </div>
          <div>
            <Button onClick={ask} disabled={!context || busy}>
              {busy ? "Generating…" : "Generate guidance"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {env && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span>Guidance</span>
              {env.requires_human_review && (
                <Badge variant="destructive">requires human review</Badge>
              )}
              {env.ai_used && <Badge variant="secondary">AI-assisted</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {env.disclaimer && (
              <p className="text-muted-foreground italic">{env.disclaimer}</p>
            )}
            {g?.summary && <p>{g.summary}</p>}
            {g?.do_today && (
              <div>
                <h4 className="font-semibold">Do today</h4>
                <ul className="list-disc pl-5">
                  {g.do_today.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {g?.avoid_24h && (
              <div>
                <h4 className="font-semibold">Avoid in next 24h</h4>
                <ul className="list-disc pl-5">
                  {g.avoid_24h.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {g?.warning_signs && (
              <div>
                <h4 className="font-semibold">Warning signs</h4>
                <ul className="list-disc pl-5">
                  {g.warning_signs.map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </div>
            )}
            {g?.followup_in_days != null && (
              <p>
                <strong>Suggested follow-up:</strong> {g.followup_in_days} days
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
