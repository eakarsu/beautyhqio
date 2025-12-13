"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react";

interface AIResponseCardProps {
  title: string;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
  copyable?: string;
  expandable?: boolean;
}

export function AIResponseCard({
  title,
  icon,
  loading,
  error,
  children,
  className = "",
  copyable,
  expandable = false,
}: AIResponseCardProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(!expandable);

  const handleCopy = async () => {
    if (copyable) {
      await navigator.clipboard.writeText(copyable);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-2 bg-gradient-to-r from-rose-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon || <Sparkles className="h-5 w-5 text-rose-500" />}
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {copyable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            )}
            {expandable && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-8 w-8 p-0"
              >
                {expanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {(expanded || !expandable) && (
        <CardContent className="pt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="relative">
                <div className="h-12 w-12 rounded-full border-4 border-rose-200 border-t-rose-500 animate-spin" />
                <Sparkles className="h-5 w-5 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-sm text-slate-500 mt-4">AI is thinking...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-red-500">
              <AlertTriangle className="h-8 w-8 mb-2" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            children
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Risk Level Badge
export function RiskBadge({ level, probability }: { level: string; probability?: number }) {
  const colors = {
    low: "bg-green-100 text-green-700 border-green-200",
    medium: "bg-amber-100 text-amber-700 border-amber-200",
    high: "bg-red-100 text-red-700 border-red-200",
  };

  return (
    <div className="flex items-center gap-2">
      <Badge className={colors[level as keyof typeof colors] || colors.medium}>
        {level.charAt(0).toUpperCase() + level.slice(1)} Risk
      </Badge>
      {probability !== undefined && (
        <span className="text-sm text-slate-500">{probability}% probability</span>
      )}
    </div>
  );
}

// Impact Badge
export function ImpactBadge({ impact }: { impact: "positive" | "negative" | "neutral" }) {
  const config = {
    positive: {
      icon: TrendingUp,
      class: "bg-green-100 text-green-700",
      label: "Positive",
    },
    negative: {
      icon: TrendingDown,
      class: "bg-red-100 text-red-700",
      label: "Negative",
    },
    neutral: {
      icon: Minus,
      class: "bg-slate-100 text-slate-700",
      label: "Neutral",
    },
  };

  const { icon: Icon, class: className, label } = config[impact];

  return (
    <Badge className={className}>
      <Icon className="h-3 w-3 mr-1" />
      {label}
    </Badge>
  );
}

// Insight Card
export function InsightCard({
  category,
  finding,
  impact,
  action,
}: {
  category: string;
  finding: string;
  impact: "positive" | "negative" | "neutral";
  action: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-white hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
          {category}
        </span>
        <ImpactBadge impact={impact} />
      </div>
      <p className="font-medium text-slate-900 mb-2">{finding}</p>
      <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-md p-2">
        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
        <span>{action}</span>
      </div>
    </div>
  );
}

// Recommendation List
export function RecommendationList({ items }: { items: string[] }) {
  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-rose-50 to-transparent"
        >
          <div className="h-6 w-6 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center flex-shrink-0">
            {index + 1}
          </div>
          <span className="text-slate-700">{item}</span>
        </div>
      ))}
    </div>
  );
}

// Confidence Meter
export function ConfidenceMeter({ value, label }: { value: number; label?: string }) {
  const getColor = (val: number) => {
    if (val >= 80) return "bg-green-500";
    if (val >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-1">
      {label && <span className="text-xs text-slate-500">{label}</span>}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-full ${getColor(value)} transition-all duration-500`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span className="text-sm font-medium text-slate-700 w-10">{value}%</span>
      </div>
    </div>
  );
}

// Loading Skeleton
export function AILoadingSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-3/4" />
      <div className="h-4 bg-slate-200 rounded w-1/2" />
      <div className="h-20 bg-slate-200 rounded" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-16 bg-slate-200 rounded" />
        <div className="h-16 bg-slate-200 rounded" />
      </div>
    </div>
  );
}
