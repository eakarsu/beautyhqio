"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function VoiceReceptionistPage() {
  return (
    <AIToolPage
      fixtureKey="voice-receptionist"
      title="Voice Receptionist"
      description="Handle an incoming caller and draft the receptionist reply."
      endpoint="/api/ai/voice-receptionist"
    />
  );
}
