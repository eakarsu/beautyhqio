"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function ShiftPreferencesPage() {
  return (
    <AIToolPage
      fixtureKey="staff-shift-preferences"
      title="Shift Preferences"
      description="Infer preferred shifts from a staff member's history."
      endpoint="/api/ai/staff-shift-preferences"
    />
  );
}
