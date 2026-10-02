"use client";

/**
 * Scenario buttons for an AI feature card on the /ai hub.
 *
 * Clicking a scenario navigates to the feature page with the scenario encoded
 * in the URL, so the destination page opens with every field already filled.
 * Scenarios are labelled so the choice is meaningful at a glance.
 */
import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { AI_FIXTURES } from "@/components/ai/AIFixtures";

export interface CardScenarioButtonsProps {
  /** Fixture key, e.g. "social-media". */
  fixtureKey: string;
  /** Destination page, e.g. "/ai/social-media". */
  href: string;
  /** Max scenarios to show on the card. */
  limit?: number;
}

export function CardScenarioButtons({ fixtureKey, href, limit = 3 }: CardScenarioButtonsProps) {
  const router = useRouter();
  const fixture = AI_FIXTURES[fixtureKey];
  if (!fixture || fixture.scenarios.length === 0) return null;

  const shown = fixture.scenarios.slice(0, limit);

  return (
    <div
      className="flex flex-wrap gap-2 pt-3 border-t border-slate-100"
      // Buttons must not trigger the card's own onClick navigation.
      onClick={(e) => e.stopPropagation()}
    >
      {shown.map((scenario) => (
        <Button
          key={scenario.label}
          type="button"
          variant="outline"
          size="sm"
          className="text-xs h-7"
          title={scenario.hint ?? `Open with the "${scenario.label}" example filled in`}
          onClick={() => {
            const values = encodeURIComponent(JSON.stringify(scenario.values));
            router.push(`${href}?scenario=${encodeURIComponent(scenario.label)}&values=${values}`);
          }}
        >
          <Sparkles className="h-3 w-3 mr-1" />
          {scenario.label}
        </Button>
      ))}
      {fixture.scenarios.length > shown.length && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-xs h-7"
          onClick={() => router.push(href)}
        >
          +{fixture.scenarios.length - shown.length} more
        </Button>
      )}
    </div>
  );
}
