"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Gift } from "lucide-react";

export default function NewLoyaltyRewardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [programId, setProgramId] = useState<string | null>(null);
  const [programLoading, setProgramLoading] = useState(true);
  const [programError, setProgramError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    pointsCost: "",
    type: "DISCOUNT",
    value: "",
  });

  useEffect(() => {
    async function fetchProgram() {
      setProgramLoading(true);
      setProgramError(null);
      try {
        const businessRes = await fetch("/api/business");
        if (!businessRes.ok) {
          setProgramError("Failed to fetch business");
          return;
        }
        const businesses = await businessRes.json();
        const businessId = businesses[0]?.id;

        if (!businessId) {
          setProgramError("No business found. Please set up your business first.");
          return;
        }

        const programRes = await fetch(`/api/loyalty?businessId=${businessId}`);
        if (programRes.ok) {
          const program = await programRes.json();
          if (program?.id) {
            setProgramId(program.id);
          } else {
            setProgramError("No loyalty program found. Please set up a loyalty program first.");
          }
        } else {
          setProgramError("Failed to fetch loyalty program");
        }
      } catch (error) {
        console.error("Error fetching program:", error);
        setProgramError("An error occurred while loading. Please try again.");
      } finally {
        setProgramLoading(false);
      }
    }
    fetchProgram();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId) {
      alert("Loyalty program not found");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/loyalty/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          programId,
          name: formData.name,
          description: formData.description,
          pointsCost: parseInt(formData.pointsCost),
          type: formData.type,
          value: formData.value ? parseFloat(formData.value) : null,
        }),
      });

      if (response.ok) {
        router.push("/loyalty");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create reward");
      }
    } catch (error) {
      console.error("Error creating reward:", error);
      alert("Failed to create reward");
    } finally {
      setIsLoading(false);
    }
  };

  if (programLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="text-center py-8 text-slate-500">Loading loyalty program...</div>
      </div>
    );
  }

  if (programError) {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">New Loyalty Reward</h1>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <p className="text-red-500 mb-4">{programError}</p>
              <Button variant="outline" onClick={() => router.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">New Loyalty Reward</h1>
          <p className="text-muted-foreground">Create a new reward for your loyalty program</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Reward Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Reward Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., $10 Off Service"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what the customer gets with this reward..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points Required *</Label>
                <Input
                  type="number"
                  value={formData.pointsCost}
                  onChange={(e) => setFormData({ ...formData, pointsCost: e.target.value })}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Reward Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT">Discount ($)</SelectItem>
                    <SelectItem value="PERCENTAGE">Percentage Off (%)</SelectItem>
                    <SelectItem value="FREE_SERVICE">Free Service</SelectItem>
                    <SelectItem value="FREE_PRODUCT">Free Product</SelectItem>
                    <SelectItem value="CUSTOM">Custom Reward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(formData.type === "DISCOUNT" || formData.type === "PERCENTAGE") && (
              <div className="space-y-2">
                <Label>Value *</Label>
                <Input
                  type="number"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  placeholder={formData.type === "DISCOUNT" ? "10.00" : "15"}
                  min="0"
                  step={formData.type === "DISCOUNT" ? "0.01" : "1"}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  {formData.type === "DISCOUNT" ? "Dollar amount off" : "Percentage off"}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={isLoading || !formData.name || !formData.pointsCost}
              >
                {isLoading ? "Creating..." : "Create Reward"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
