"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function SkinKioskPage() {
  return (
    <AIToolPage
      fixtureKey="skin-kiosk"
      title="Skin Kiosk"
      description="Cosmetic observations from a photo, within consent limits."
      endpoint="/api/ai/skin-kiosk"
    />
  );
}
