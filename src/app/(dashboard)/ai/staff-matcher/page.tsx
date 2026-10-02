"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function StaffMatcherPage() {
  return (
    <AIToolPage
      fixtureKey="staff-matcher"
      title="Staff Matcher"
      description="Match a client and service to the best-suited staff member."
      endpoint="/api/ai/staff-matcher"
    />
  );
}
