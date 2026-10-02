"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function TranslatePage() {
  return (
    <AIToolPage
      fixtureKey="translate"
      title="Translate"
      description="Translate a client-facing message into another language."
      endpoint="/api/ai/translate"
    />
  );
}
