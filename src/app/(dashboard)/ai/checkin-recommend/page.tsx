"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function CheckInRecommendationsPage() {
  return (
    <AIToolPage
      fixtureKey="checkin-recommend"
      title="Check-in Recommendations"
      description="Suggest add-ons and next steps when a client checks in."
      endpoint="/api/ai/checkin-recommend"
    />
  );
}
