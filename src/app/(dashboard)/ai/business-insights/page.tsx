"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function BusinessInsightsPage() {
  return (
    <AIToolPage
      fixtureKey="business-insights"
      title="Business Insights"
      description="Summarise operating performance over a period."
      endpoint="/api/ai/business-insights"
    />
  );
}
