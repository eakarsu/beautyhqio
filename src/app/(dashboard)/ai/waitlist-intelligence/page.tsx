"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function WaitlistIntelligencePage() {
  return (
    <AIToolPage
      fixtureKey="waitlist-intelligence"
      title="Waitlist Intelligence"
      description="Rank waitlisted clients for a given opening."
      endpoint="/api/ai/waitlist-intelligence"
    />
  );
}
