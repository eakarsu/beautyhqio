"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function ReviewResponsePage() {
  return (
    <AIToolPage
      fixtureKey="review-response"
      title="Review Response"
      description="Draft a reply to a customer review."
      endpoint="/api/ai/review-response"
    />
  );
}
