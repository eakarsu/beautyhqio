"use client";

// Generated from the AI route + fixture registry. See src/components/ai/AIToolPage.tsx
import { AIToolPage } from "@/components/ai/AIToolPage";

export default function InventoryAutopilotPage() {
  return (
    <AIToolPage
      fixtureKey="inventory-autopilot"
      title="Inventory Autopilot"
      description="Review stock and suggest reorders."
      endpoint="/api/ai/inventory-autopilot"
    />
  );
}
