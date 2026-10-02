"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function BookingAssistantPage() {
  return (
    <AIToolPage
      fixtureKey="booking-assistant"
      title="Booking Assistant"
      description="Turn a natural-language request into a booking suggestion."
      endpoint="/api/ai/booking-assistant"
    />
  );
}
