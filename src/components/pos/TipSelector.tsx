"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";

interface TipSelectorProps {
  subtotal: number;
  onTipChange: (tip: number) => void;
  selectedTip?: number;
}

const TIP_PERCENTAGES = [15, 18, 20, 25];

export function TipSelector({ subtotal, onTipChange, selectedTip = 0 }: TipSelectorProps) {
  const [customTip, setCustomTip] = useState("");
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);

  const handlePercentageSelect = (percentage: number) => {
    const tipAmount = (subtotal * percentage) / 100;
    setSelectedPercentage(percentage);
    setCustomTip("");
    onTipChange(tipAmount);
  };

  const handleCustomTipChange = (value: string) => {
    setCustomTip(value);
    setSelectedPercentage(null);
    const tipAmount = parseFloat(value) || 0;
    onTipChange(tipAmount);
  };

  const handleNoTip = () => {
    setSelectedPercentage(null);
    setCustomTip("");
    onTipChange(0);
  };

  return (
    <div className="space-y-4">
      <Label className="text-base font-medium">Add Tip</Label>

      <div className="grid grid-cols-4 gap-2">
        {TIP_PERCENTAGES.map((percentage) => {
          const tipAmount = (subtotal * percentage) / 100;
          const isSelected = selectedPercentage === percentage;

          return (
            <Button
              key={percentage}
              variant={isSelected ? "default" : "outline"}
              className="flex flex-col h-auto py-3"
              onClick={() => handlePercentageSelect(percentage)}
            >
              <span className="text-lg font-semibold">{percentage}%</span>
              <span className="text-xs opacity-70">${tipAmount.toFixed(2)}</span>
            </Button>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button
          variant={selectedTip === 0 && !customTip ? "default" : "outline"}
          size="sm"
          onClick={handleNoTip}
        >
          No Tip
        </Button>

        <div className="flex-1 relative">
          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="number"
            placeholder="Custom amount"
            value={customTip}
            onChange={(e) => handleCustomTipChange(e.target.value)}
            className="pl-9"
            min="0"
            step="0.01"
          />
        </div>
      </div>

      {selectedTip > 0 && (
        <p className="text-sm text-muted-foreground text-center">
          Tip: ${selectedTip.toFixed(2)}
          {selectedPercentage && ` (${selectedPercentage}%)`}
        </p>
      )}
    </div>
  );
}
