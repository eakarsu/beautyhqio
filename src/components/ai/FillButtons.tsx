"use client";

/**
 * Scenario buttons for AI feature forms.
 *
 * Renders one button per complete scenario. Clicking any button fills EVERY
 * field of the form at once and, when an `onRun` handler is supplied, immediately
 * runs the action with those same values — so one click takes the user from
 * empty form to a rendered result.
 *
 * Values are deterministic and clearly fictional.
 */
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, Loader2 } from "lucide-react";
import {
  type AIFixture,
  scenarioValues,
} from "@/components/ai/AIFixtures";

export interface FillButtonsProps {
  fixture: AIFixture;
  /** Applies a complete set of values to page state. */
  apply: (values: Record<string, string>) => void;
  /**
   * Runs the feature's action with the values that were just applied. Receives
   * the values directly so it does not depend on state having settled yet.
   */
  onRun?: (values: Record<string, string>) => void;
  /** Optional: clear the form. */
  onClear?: () => void;
  /**
   * Real ids resolved from the database (clientId, serviceId, …) so a scenario
   * produces a valid request without inventing an identifier.
   */
  resolvers?: Record<string, string>;
  /** Compact mode uses smaller buttons. */
  compact?: boolean;
  /** Disables every button while a run is in flight. */
  running?: boolean;
}

export function FillButtons({
  fixture,
  apply,
  onRun,
  onClear,
  resolvers = {},
  compact = false,
  running = false,
}: FillButtonsProps) {
  const [applied, setApplied] = React.useState<string | null>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {fixture.scenarios.map((scenario) => {
          const isApplied = applied === scenario.label;
          return (
            <Button
              key={scenario.label}
              type="button"
              variant={isApplied ? "default" : "secondary"}
              size={compact ? "sm" : "default"}
              disabled={running}
              onClick={() => {
                const values = scenarioValues(fixture, scenario, resolvers);
                apply(values);
                setApplied(scenario.label);
                onRun?.(values);
              }}
              title={
                scenario.hint ??
                `Fill every field with "${scenario.label}"${onRun ? " and run it" : ""}`
              }
            >
              {running && isApplied ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : isApplied ? (
                <Check className="h-4 w-4 mr-2" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {scenario.label}
            </Button>
          );
        })}

        {onClear && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={running}
            onClick={() => {
              onClear();
              setApplied(null);
            }}
          >
            Clear
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {onRun
          ? "Each button fills every field with a complete example and runs it."
          : "Each button fills every field with a complete example scenario."}
      </p>
    </div>
  );
}
