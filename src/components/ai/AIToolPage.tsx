"use client";

/**
 * Shared shell for AI feature pages.
 *
 * Gives every AI tool the same structure — heading, description, scenario
 * buttons that fill EVERY field and immediately run, a form, and a rendered
 * result. Adding a feature is a small declaration rather than a 400-line page.
 *
 * Results are rendered by <AIResultView/>, which turns whatever the endpoint
 * returns into readable sections, metrics and lists. The raw payload stays
 * available behind a collapsed "Developer details" disclosure.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { FillButtons } from "@/components/ai/FillButtons";
import { AIResultView } from "@/components/ai/AIResultView";
import {
  AI_FIXTURES,
  type AIFixture,
  fieldLabel,
  RUNTIME_RESOLVED_FIELDS,
  USER_SUPPLIED_FIELDS,
} from "@/components/ai/AIFixtures";

/** Fields that read better as a multi-line box. */
const LONG_TEXT_FIELDS = new Set([
  "text", "review", "message", "speechInput", "notes", "clientHistory",
  "context", "constraints", "details", "preferences", "additionalInfo",
  "topic", "reason", "lifestyle",
]);

export interface AIFieldSpec {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "number";
  placeholder?: string;
}

export interface AIToolPageProps {
  /** Registry key in AI_FIXTURES. */
  fixtureKey: string;
  /** Heading shown at the top of the page. */
  title: string;
  /** One-line explanation of what the tool does. */
  description: string;
  /** API path, e.g. /api/ai/translate */
  endpoint: string;
  /** Method; defaults to POST. GET tools use query params. */
  method?: "POST" | "GET";
}

type Dict = Record<string, unknown>;
interface Option {
  id: string;
  label: string;
}

/**
 * Runtime ids the page can resolve from the database, so a scenario button
 * fills real identifiers instead of leaving the field blank.
 */
const RESOLVER_SOURCES: Record<string, { url: string; label: (row: Dict) => string }> = {
  clientId: { url: "/api/clients?limit=50", label: (c) => clientName(c) },
  staffId: { url: "/api/staff", label: staffName },
  preferredStaff: { url: "/api/staff", label: staffName },
  serviceId: { url: "/api/services", label: (s) => text(s.name) || text(s.id) },
  locationId: { url: "/api/locations", label: (l) => text(l.name) || text(l.id) },
  appointmentId: { url: "/api/appointments", label: appointmentName },
  waitlistClientIds: { url: "/api/waitlist", label: (e) => clientName(e.client as Dict) },
};

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function fullName(person: Dict | undefined): string {
  if (!person) return "";
  return [text(person.firstName), text(person.lastName)].filter(Boolean).join(" ");
}

function clientName(client: Dict | undefined): string {
  return fullName(client) || text(client?.name) || text(client?.email) || text(client?.id);
}

function staffName(staff: Dict): string {
  return (
    text(staff.displayName) ||
    fullName(staff.user as Dict) ||
    text(staff.name) ||
    text(staff.email) ||
    text(staff.id)
  );
}

function appointmentName(apt: Dict): string {
  const who = clientName(apt.client as Dict) || text(apt.title) || text(apt.id);
  const when = text(apt.scheduledStart);
  if (!when) return who;
  const date = new Date(when);
  const stamp = Number.isNaN(date.getTime()) ? when : date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return [who, stamp].filter(Boolean).join(" • ");
}

function extractRows(payload: unknown): Dict[] {
  if (Array.isArray(payload)) return payload.filter(isDict);
  if (isDict(payload)) {
    const preferred = [
      "clients", "staff", "services", "locations", "appointments",
      "entries", "waitlist", "data", "items", "results", "rows",
    ];
    for (const key of preferred) {
      if (Array.isArray(payload[key])) return (payload[key] as unknown[]).filter(isDict);
    }
    for (const value of Object.values(payload)) {
      if (Array.isArray(value)) return value.filter(isDict);
    }
  }
  return [];
}

/** Loads selectable options for the runtime-id fields of a fixture. */
function useResolverOptions(fixture: AIFixture | undefined): Record<string, Option[]> {
  const [options, setOptions] = React.useState<Record<string, Option[]>>({});
  const fields = fixture
    ? fixture.fields.filter((field) => RESOLVER_SOURCES[field])
    : [];

  React.useEffect(() => {
    if (fields.length === 0) return;
    let cancelled = false;
    const load = async () => {
      const next: Record<string, Option[]> = {};
      await Promise.all(
        fields.map(async (field) => {
          try {
            const response = await fetch(RESOLVER_SOURCES[field].url, {
              headers: { Accept: "application/json" },
            });
            if (!response.ok) return;
            const data = await response.json();
            next[field] = extractRows(data)
              .map((row) => ({
                id: String(row.id ?? ""),
                label: RESOLVER_SOURCES[field].label(row),
              }))
              .filter((option) => option.id !== "")
              .map((option) => ({ ...option, label: option.label || option.id }));
          } catch {
            // Non-fatal: the field simply stays free-text.
          }
        }),
      );
      if (!cancelled) setOptions(next);
    };
    void load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fixture?.key]);

  return options;
}

export function AIToolPage({
  fixtureKey,
  title,
  description,
  endpoint,
  method = "POST",
}: AIToolPageProps) {
  const router = useRouter();
  const fixture: AIFixture = AI_FIXTURES[fixtureKey];

  const [values, setValues] = React.useState<Record<string, string>>({});
  const [result, setResult] = React.useState<unknown>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  const options = useResolverOptions(fixture);

  const setField = (name: string, value: string) => setValues((v) => ({ ...v, [name]: value }));

  /** Values the request should use, filling runtime ids with the first option. */
  const withDefaults = React.useCallback(
    (base: Record<string, string>): Record<string, string> => {
      const out = { ...base };
      for (const field of fixture.fields) {
        const opts = options[field];
        if (!out[field] && opts && opts.length > 0) out[field] = opts[0].id;
      }
      return out;
    },
    [fixture, options],
  );

  const run = async (overrideValues?: Record<string, string>) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const input = withDefaults(overrideValues ?? values);
      const url =
        method === "GET"
          ? `${endpoint}${
              Object.entries(input).filter(([, v]) => v !== "").length
                ? `?${new URLSearchParams(
                    Object.entries(input).filter(([, v]) => v !== "") as [string, string][],
                  )}`
                : ""
            }`
          : endpoint;

      const response = await fetch(url, {
        method,
        ...(method === "POST"
          ? {
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(
                Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined && v !== "")),
              ),
            }
          : {}),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error((data as { error?: string }).error || `Request failed (${response.status})`);
      }
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  // A scenario clicked on the AI hub arrives as ?values=<json>; fill the form
  // and run it once the runtime-id options (if any) have loaded.
  const scenarioApplied = React.useRef(false);
  React.useEffect(() => {
    if (!fixture || scenarioApplied.current) return;
    if (typeof window === "undefined") return;
    const raw = new URLSearchParams(window.location.search).get("values");
    if (!raw) {
      scenarioApplied.current = true;
      return;
    }
    let parsed: Record<string, string>;
    try {
      const obj = JSON.parse(raw);
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        scenarioApplied.current = true;
        return;
      }
      parsed = obj as Record<string, string>;
    } catch {
      scenarioApplied.current = true;
      return;
    }
    const needsOptions = fixture.fields.some((field) => RESOLVER_SOURCES[field]);
    if (needsOptions && Object.keys(options).length === 0) return;

    scenarioApplied.current = true;
    setValues((v) => ({ ...v, ...withDefaults(parsed) }));
    void run(parsed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  if (!fixture) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-sm text-muted-foreground">Unknown fixture: {fixtureKey}</p>
      </div>
    );
  }

  // Values used to seed scenarios: current entries plus a resolved default id
  // for every runtime field that has options.
  const resolverValues: Record<string, string> = {};
  for (const field of fixture.fields) {
    if (values[field]) resolverValues[field] = values[field];
    else if (options[field]?.length) resolverValues[field] = options[field][0].id;
  }

  // Fields with no value yet, and which no scenario or resolver supplies.
  const scenarioSupplied = new Set(fixture.scenarios.flatMap((s) => Object.keys(s.values)));
  const missingRequired = fixture.fields.filter(
    (f) =>
      !scenarioSupplied.has(f) &&
      !RUNTIME_RESOLVED_FIELDS.has(f) &&
      !USER_SUPPLIED_FIELDS.has(f) &&
      String(values[f] ?? "").trim() === "",
  );

  return (
    <div className="container mx-auto p-6 max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")} aria-label="Back to AI tools">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Try an example</CardTitle>
          <CardDescription>
            Pick an example to fill every field and run it, or enter your own values below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FillButtons
            fixture={fixture}
            apply={(next) => setValues((v) => ({ ...v, ...withDefaults(next) }))}
            onRun={(next) => void run(next)}
            onClear={() => setValues({})}
            resolvers={resolverValues}
            running={loading}
          />

          {fixture.fields.map((field) => {
            const opts = options[field];
            if (opts && opts.length > 0) {
              return (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field}>{fieldLabel(field)}</Label>
                  <Select value={values[field] ?? ""} onValueChange={(v) => setField(field, v)}>
                    <SelectTrigger id={field}>
                      <SelectValue placeholder={`Select ${fieldLabel(field).toLowerCase()}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {opts.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              );
            }

            return (
              <div key={field} className="space-y-2">
                <Label htmlFor={field}>{fieldLabel(field)}</Label>
                {LONG_TEXT_FIELDS.has(field) ? (
                  <Textarea
                    id={field}
                    rows={3}
                    value={values[field] ?? ""}
                    onChange={(e) => setField(field, e.target.value)}
                  />
                ) : (
                  <Input
                    id={field}
                    value={values[field] ?? ""}
                    onChange={(e) => setField(field, e.target.value)}
                  />
                )}
              </div>
            );
          })}

          <Button onClick={() => void run()} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Run analysis
              </>
            )}
          </Button>

          {missingRequired.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Still needed: {missingRequired.map(fieldLabel).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-start gap-2 text-destructive">
            <AlertCircle className="h-4 w-4 mt-0.5" />
            <span className="text-sm">{error}</span>
          </CardContent>
        </Card>
      )}

      {result !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Result
              <Badge variant="outline">AI</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AIResultView data={result} title={title} />
            <details className="text-xs">
              <summary className="cursor-pointer text-muted-foreground">Developer details</summary>
              <pre className="mt-2 overflow-auto rounded bg-muted p-3">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AIToolPage;
