"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function AppointmentOptimizerPage() {
  return (
    <AIToolPage
      fixtureKey="appointment-optimizer"
      title="Appointment Optimizer"
      description="Find schedule gaps and suggest improvements for a day."
      endpoint="/api/ai/appointment-optimizer"
    />
  );
}
