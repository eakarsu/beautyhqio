"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function BeforeAndAfterPage() {
  return (
    <AIToolPage
      fixtureKey="before-after"
      title="Before & After"
      description="Compare two service photographs."
      endpoint="/api/ai/before-after"
    />
  );
}
