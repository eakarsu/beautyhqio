"use client";

/**
 * Generic, human-friendly renderer for AI tool responses.
 *
 * AI endpoints return many different shapes. Rather than dumping the payload as
 * JSON, this component walks the object and picks a readable presentation for
 * each kind of value:
 *
 *   - long strings      -> prose blocks
 *   - numbers           -> metric tiles (with a bar when they look like scores)
 *   - booleans          -> Yes / No badges
 *   - string lists      -> bullet or chip lists
 *   - object lists      -> cards
 *   - nested objects    -> titled sub-sections
 *
 * It is intentionally schema-less: anything unfamiliar still renders as a
 * labelled value, so a new endpoint never shows a blank panel.
 */
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  XCircle,
} from "lucide-react";

type Dict = Record<string, unknown>;

const SKIP_KEYS = new Set(["success", "model", "generatedAt", "generated_at"]);
const META_KEYS = new Set(["model", "generatedAt", "generated_at"]);

const SCORE_RE =
  /(score|confidence|probability|percent|percentage|rate|risk|chance|likelihood|utilization|occupancy|sentiment|mood)/i;
const CURRENCY_RE =
  /(revenue|price|cost|amount|total|value|spend|sales|profit|margin|budget|ticket|reorder)/i;
const DATE_RE =
  /(date|datetime|time|start|end|created|updated|deadline|scheduled)/i;
const TEXT_RE =
  /(summary|message|text|translation|response|draft|content|recommendation|suggestion|insight|analysis|explanation|reason|detail|note|description|advice|feedback|copy|reply|greeting|body|theme)/i;
/** Keys whose value is the headline answer of the tool. */
const PRIMARY_TEXT_RE =
  /(translation|message|draft|summary|response|reply|caption|body|content|suggestedresponse|personalizedmessage)/i;
const LIST_RE =
  /(recommendation|suggestion|action|step|tip|item|factor|theme|insight|next|task|highlight|concern|benefit|improvement|keyword|issue|area|goal)/i;

const HUMAN_LABELS: Record<string, string> = {
  clientId: "Client",
  staffId: "Staff member",
  serviceId: "Service",
  locationId: "Location",
  appointmentId: "Appointment",
  waitlistClientIds: "Waitlisted clients",
  preferredStaff: "Preferred staff",
  targetLanguage: "Target language",
  detectedSourceLanguage: "Detected source language",
  riskScore: "Risk score",
  riskLevel: "Risk level",
  noShowProbability: "No-show probability",
  reorderAlerts: "Reorder alerts",
  trendingUp: "Trending up",
  trendingDown: "Trending down",
  purchaseRecommendations: "Purchase recommendations",
  topServices: "Top services",
  lowPerformingServices: "Low performing services",
  suggestedActions: "Suggested actions",
  suggestedResponse: "Suggested response",
  keyThemes: "Key themes",
  actionItems: "Action items",
  nextSteps: "Next steps",
  draftText: "Draft",
  imageUrl: "Image",
};

function isDict(value: unknown): value is Dict {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function humanize(key: string): string {
  if (HUMAN_LABELS[key]) return HUMAN_LABELS[key];
  const spaced = key
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .trim();
  return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : key;
}

function isIsoDate(value: string): boolean {
  return (
    /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    ...(value.includes("T") ? { timeStyle: "short" as const } : {}),
  });
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
}

function looksLikeScore(key: string): boolean {
  return SCORE_RE.test(key);
}

function percentOf(value: number): number {
  // Scores arrive as either 0..1 or 0..100.
  const normalized = value > 0 && value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(normalized)));
}

/** Small coloured badge for sentiment / priority / status style values. */
function toneFor(value: string): "positive" | "negative" | "warn" | "neutral" {
  const v = value.toLowerCase();
  if (/(positive|good|high confidence|low risk|approved|success|excellent|great|urgent$)/.test(v))
    return "positive";
  if (/(negative|poor|bad|critical|high risk|failed|error|reject|severe)/.test(v)) return "negative";
  if (/(warn|medium|moderate|attention|pending|caution|review)/.test(v)) return "warn";
  return "neutral";
}

const TONE_CLASS: Record<ReturnType<typeof toneFor>, string> = {
  positive: "border-green-200 bg-green-50 text-green-700",
  negative: "border-red-200 bg-red-50 text-red-700",
  warn: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-slate-200 bg-slate-50 text-slate-700",
};

function ScalarValue({ label, value }: { label: string; value: unknown }) {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }

  if (typeof value === "boolean") {
    return value ? (
      <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Yes
      </Badge>
    ) : (
      <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
        <XCircle className="mr-1 h-3 w-3" /> No
      </Badge>
    );
  }

  if (typeof value === "number") {
    if (looksLikeScore(label)) return `${percentOf(value)}%`;
    if (CURRENCY_RE.test(label)) {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 2,
      }).format(value);
    }
    return formatNumber(value);
  }

  const str = String(value);
  if (isUrl(str)) {
    return (
      <a href={str} target="_blank" rel="noreferrer" className="text-primary underline">
        {str}
      </a>
    );
  }
  if (isIsoDate(str) && DATE_RE.test(label)) return formatDate(str);
  if (str.length > 90 || str.includes("\n")) {
    return <span className="whitespace-pre-wrap leading-relaxed">{str}</span>;
  }
  return <span>{str}</span>;
}

function MetricTile({ label, value }: { label: string; value: number }) {
  const pct = percentOf(value);
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {humanize(label)}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{pct}%</p>
      <Progress value={pct} className="mt-2 h-1.5" />
    </div>
  );
}

function StringList({ items, keyName }: { items: string[]; keyName: string }) {
  const chip = LIST_RE.test(keyName);
  if (chip) {
    return (
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs font-normal">
            {item}
          </Badge>
        ))}
      </div>
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
          <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
          <span className="whitespace-pre-wrap">{item}</span>
        </li>
      ))}
    </ul>
  );
}

function ItemCard({ item }: { item: Dict }) {
  const entries = Object.entries(item).filter(([k]) => !SKIP_KEYS.has(k));
  if (entries.length === 0) return null;

  // Prefer a name/title as the card heading.
  const headingKey = ["name", "title", "product", "productName", "service", "label", "clientName"].find(
    (k) => typeof item[k] === "string",
  );

  return (
    <div className="space-y-2 rounded-lg border bg-card p-4">
      {headingKey && (
        <p className="font-medium text-slate-900">{String(item[headingKey])}</p>
      )}
      <dl className="space-y-1.5">
        {entries
          .filter(([k]) => k !== headingKey)
          .map(([k, v]) => (
            <div key={k} className="flex items-start justify-between gap-4 text-sm">
              <dt className="text-muted-foreground">{humanize(k)}</dt>
              <dd className="max-w-[65%] text-right font-medium text-slate-800">
                <ScalarValue label={k} value={v} />
              </dd>
            </div>
          ))}
      </dl>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      {children}
    </section>
  );
}

function ValueBlock({ label, value }: { label: string; value: unknown }): React.ReactElement {
  // Arrays ---------------------------------------------------------------
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return <ScalarValue label={label} value="—" />;
    }
    if (value.every((v) => typeof v === "string")) {
      return <StringList items={value as string[]} keyName={label} />;
    }
    if (value.every((v) => isDict(v))) {
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          {(value as Dict[]).map((item, i) => (
            <ItemCard key={i} item={item} />
          ))}
        </div>
      );
    }
    return (
      <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
        {value.map((v, i) => (
          <li key={i}>
            <ValueBlock label={label} value={v} />
          </li>
        ))}
      </ul>
    );
  }

  // Objects --------------------------------------------------------------
  if (isDict(value)) {
    const entries = Object.entries(value).filter(([k]) => !SKIP_KEYS.has(k));
    if (entries.length === 0) return <ScalarValue label={label} value="—" />;
    return (
      <div className="space-y-3 rounded-lg border bg-slate-50/60 p-4">
        {entries.map(([k, v]) => (
          <ValueBlock key={k} label={k} value={v} />
        ))}
      </div>
    );
  }

  // Scalars --------------------------------------------------------------
  if (typeof value === "number" && looksLikeScore(label)) {
    return <MetricTile label={label} value={value} />;
  }

  if (typeof value === "string" && TEXT_RE.test(label) && value.length > 60) {
    return (
      <div className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
          <Sparkles className="h-3 w-3" />
          {humanize(label)}
        </p>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{value}</p>
      </div>
    );
  }

  if (typeof value === "string" && LIST_RE.test(label) && value.length < 60) {
    return <Badge variant="secondary">{value}</Badge>;
  }

  if (typeof value === "string" && !TEXT_RE.test(label) && !DATE_RE.test(label) && value.length < 40) {
    const tone = toneFor(value);
    if (/(sentiment|priority|status|level|tone|category|type)/i.test(label)) {
      return (
        <Badge variant="outline" className={cn("capitalize", TONE_CLASS[tone])}>
          {value}
        </Badge>
      );
    }
  }

  return (
    <div className="text-sm text-slate-800">
      <ScalarValue label={label} value={value} />
    </div>
  );
}

export interface AIResultViewProps {
  data: unknown;
  /** Optional heading override. */
  title?: string;
  className?: string;
}

export function AIResultView({ data, title = "Result", className }: AIResultViewProps) {
  const content = React.useMemo(() => {
    if (data === null || data === undefined) {
      return <p className="text-sm text-muted-foreground">No result returned.</p>;
    }

    // Unwrap a lone { data: ... } / { result: ... } envelope.
    let payload: unknown = data;
    if (isDict(payload)) {
      const keys = Object.keys(payload).filter((k) => !SKIP_KEYS.has(k));
      const envelope = ["data", "result", "prediction", "analysis"].find(
        (k) => isDict(payload) && keys.length === 1 && keys[0] === k,
      );
      if (envelope && isDict(payload)) payload = payload[envelope];
    }

    if (!isDict(payload)) {
      return <ValueBlock label={title} value={payload} />;
    }

    // Error payloads get an alert treatment.
    if (typeof payload.error === "string" && Object.keys(payload).length <= 2) {
      return (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{payload.error}</span>
        </div>
      );
    }

    const entries = Object.entries(payload).filter(([k]) => !META_KEYS.has(k));

    // The headline answer (translation, message, draft) is shown first, at full
    // width, so it is never buried among the smaller fields.
    const highlightKeys = new Set(
      entries
        .filter(([k, v]) => typeof v === "string" && PRIMARY_TEXT_RE.test(k) && (v as string).length > 20)
        .map(([k]) => k),
    );
    const highlights = entries.filter(([k]) => highlightKeys.has(k));
    const rest = entries.filter(([k]) => !highlightKeys.has(k));
    const metrics = rest.filter(([k, v]) => typeof v === "number" && looksLikeScore(k));
    const structures = rest.filter(([, v]) => typeof v === "object" && v !== null);
    const plain = rest.filter(
      ([k, v]) => !(typeof v === "number" && looksLikeScore(k)) && !(typeof v === "object" && v !== null),
    );

    return (
      <div className="space-y-5">
        {highlights.map(([k, v]) => (
          <div key={k} className="rounded-lg border-l-4 border-primary bg-primary/5 p-4">
            <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-3 w-3" />
              {humanize(k)}
            </p>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800">{String(v)}</p>
          </div>
        ))}

        {metrics.length + plain.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {metrics.map(([k, v]) => (
              <MetricTile key={k} label={k} value={v as number} />
            ))}
            {plain.map(([k, v]) => (
              <div key={k} className="space-y-1 rounded-lg border bg-card p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {humanize(k)}
                </p>
                <div className="font-medium text-slate-900">
                  <ScalarValue label={k} value={v} />
                </div>
              </div>
            ))}
          </div>
        )}

        {structures.map(([k, v]) => (
          <Section key={k} title={humanize(k)}>
            <ValueBlock label={k} value={v} />
          </Section>
        ))}
      </div>
    );
  }, [data, title]);

  return <div className={cn("space-y-3", className)}>{content}</div>;
}

export default AIResultView;
