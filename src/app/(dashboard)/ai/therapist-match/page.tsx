"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function TherapistMatchPage() {
  return (
    <AIToolPage
      fixtureKey="therapist-match"
      title="Therapist Match"
      description="Match a client to a suitable therapist for a service."
      endpoint="/api/ai/therapist-match"
    />
  );
}
