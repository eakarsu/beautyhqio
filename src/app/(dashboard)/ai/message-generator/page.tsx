"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function MessageGeneratorPage() {
  return (
    <AIToolPage
      fixtureKey="message-generator"
      title="Message Generator"
      description="Draft a client message for a chosen purpose and tone."
      endpoint="/api/ai/message-generator"
    />
  );
}
