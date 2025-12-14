"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, Trash2, Gift } from "lucide-react";

interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  type: string;
  value: number | string;
  isActive: boolean;
}

export default function RewardDetailPage() {
  const router = useRouter();
  const params = useParams();
  const rewardId = params.id as string;

  const [reward, setReward] = useState<LoyaltyReward | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [type, setType] = useState("");
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function fetchReward() {
      try {
        const response = await fetch(`/api/loyalty/rewards/${rewardId}`);
        if (response.ok) {
          const data = await response.json();
          setReward(data);
          setName(data.name);
          setDescription(data.description || "");
          setPointsCost(data.pointsCost.toString());
          setType(data.type);
          setValue(data.value?.toString() || "");
          setIsActive(data.isActive);
        } else {
          router.push("/loyalty/rewards");
        }
      } catch (error) {
        console.error("Error fetching reward:", error);
        router.push("/loyalty/rewards");
      } finally {
        setIsLoading(false);
      }
    }
    fetchReward();
  }, [rewardId, router]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(`/api/loyalty/rewards/${rewardId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          pointsCost: parseInt(pointsCost),
          type,
          value: parseFloat(value) || 0,
          isActive,
        }),
      });

      if (response.ok) {
        router.push("/loyalty/rewards");
      } else {
        alert("Failed to update reward");
      }
    } catch (error) {
      console.error("Error updating reward:", error);
      alert("Failed to update reward");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/loyalty/rewards/${rewardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/loyalty/rewards");
      } else {
        alert("Failed to delete reward");
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Failed to delete reward");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-slate-500">Loading reward...</p>
      </div>
    );
  }

  if (!reward) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/loyalty/rewards")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Edit Reward</h1>
            <p className="text-slate-500 mt-1">Update reward details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="text-red-600 hover:text-red-700"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Reward Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Reward Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., $10 Off Service"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the reward..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Reward Type</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DISCOUNT_AMOUNT">Dollar Amount Off</SelectItem>
                    <SelectItem value="DISCOUNT_PERCENT">Percentage Off</SelectItem>
                    <SelectItem value="FREE_SERVICE">Free Service</SelectItem>
                    <SelectItem value="FREE_PRODUCT">Free Product</SelectItem>
                    <SelectItem value="PERK">Special Perk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value">
                  {type === "DISCOUNT_PERCENT" ? "Percentage" : "Value ($)"}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={type === "DISCOUNT_PERCENT" ? "10" : "10.00"}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pointsCost">Points Required</Label>
              <Input
                id="pointsCost"
                type="number"
                value={pointsCost}
                onChange={(e) => setPointsCost(e.target.value)}
                placeholder="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Status Card */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active</p>
                <p className="text-sm text-slate-500">
                  {isActive ? "Reward is available" : "Reward is hidden"}
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

            <div className="pt-4 border-t">
              <p className="text-sm text-slate-500 mb-2">Current Status</p>
              <Badge variant={isActive ? "success" : "secondary"}>
                {isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Reward</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this reward? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
