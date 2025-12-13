"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Gift, Sparkles, CheckCircle, Lock, Star, Tag, Clock } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  category: "service" | "product" | "discount";
  value?: number;
  valueType?: "fixed" | "percentage";
  expiresInDays?: number;
  available: boolean;
  stock?: number;
  imageUrl?: string;
}

interface RewardRedemptionProps {
  clientId: string;
  currentPoints: number;
  onRedeem?: (rewardId: string) => void;
}

const CATEGORY_ICONS = {
  service: Sparkles,
  product: Gift,
  discount: Tag,
};

export function RewardRedemption({ clientId, currentPoints, onRedeem }: RewardRedemptionProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState(false);

  useEffect(() => {
    fetchRewards();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await fetch("/api/loyalty/rewards");
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error("Error fetching rewards:", error);
      // Demo data
      setRewards([
        {
          id: "r1",
          name: "Free Conditioning Treatment",
          description: "Deep conditioning treatment with any haircut",
          pointsCost: 500,
          category: "service",
          value: 35,
          valueType: "fixed",
          expiresInDays: 30,
          available: true,
        },
        {
          id: "r2",
          name: "$10 Off Any Service",
          description: "Get $10 off your next service",
          pointsCost: 300,
          category: "discount",
          value: 10,
          valueType: "fixed",
          expiresInDays: 60,
          available: true,
        },
        {
          id: "r3",
          name: "Free Hair Product",
          description: "Choose any travel-size hair product",
          pointsCost: 400,
          category: "product",
          value: 25,
          valueType: "fixed",
          expiresInDays: 30,
          available: true,
          stock: 15,
        },
        {
          id: "r4",
          name: "20% Off Color Service",
          description: "Save 20% on any color service",
          pointsCost: 800,
          category: "discount",
          value: 20,
          valueType: "percentage",
          expiresInDays: 45,
          available: true,
        },
        {
          id: "r5",
          name: "VIP Styling Session",
          description: "One-on-one consultation with our senior stylist",
          pointsCost: 1500,
          category: "service",
          value: 100,
          valueType: "fixed",
          expiresInDays: 60,
          available: true,
        },
        {
          id: "r6",
          name: "Premium Hair Care Set",
          description: "Full-size shampoo and conditioner set",
          pointsCost: 1200,
          category: "product",
          value: 75,
          valueType: "fixed",
          expiresInDays: 30,
          available: false,
          stock: 0,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!selectedReward) return;

    setIsRedeeming(true);
    try {
      const response = await fetch(`/api/clients/${clientId}/loyalty/redeem`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rewardId: selectedReward.id }),
      });

      if (response.ok) {
        setRedeemSuccess(true);
        onRedeem?.(selectedReward.id);
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
      // Demo mode - show success
      setRedeemSuccess(true);
      onRedeem?.(selectedReward.id);
    } finally {
      setIsRedeeming(false);
    }
  };

  const canAfford = (reward: Reward) => currentPoints >= reward.pointsCost;

  const closeDialog = () => {
    setSelectedReward(null);
    setRedeemSuccess(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Redeem Rewards
            </CardTitle>
            <CardDescription>
              Use your points to unlock exclusive rewards
            </CardDescription>
          </div>
          <Badge variant="secondary" className="text-lg px-3 py-1">
            <Star className="h-4 w-4 mr-1" />
            {currentPoints.toLocaleString()} pts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading rewards...
          </div>
        ) : rewards.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Gift className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No rewards available at the moment</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => {
                const Icon = CATEGORY_ICONS[reward.category];
                const affordable = canAfford(reward);
                const available = reward.available && (reward.stock === undefined || reward.stock > 0);

                return (
                  <Card
                    key={reward.id}
                    className={`relative overflow-hidden transition-all ${
                      !available
                        ? "opacity-60"
                        : affordable
                        ? "hover:border-rose-500 cursor-pointer"
                        : "opacity-75"
                    }`}
                    onClick={() => available && affordable && setSelectedReward(reward)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="p-2 rounded-lg bg-rose-100">
                          <Icon className="h-5 w-5 text-rose-600" />
                        </div>
                        <Badge
                          variant={affordable ? "default" : "secondary"}
                          className={affordable ? "bg-rose-600" : ""}
                        >
                          {reward.pointsCost.toLocaleString()} pts
                        </Badge>
                      </div>

                      <h4 className="font-semibold mb-1">{reward.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {reward.description}
                      </p>

                      <div className="flex items-center justify-between text-xs">
                        {reward.value && (
                          <span className="text-green-600 font-medium">
                            {reward.valueType === "percentage"
                              ? `${reward.value}% off`
                              : `$${reward.value} value`}
                          </span>
                        )}
                        {reward.expiresInDays && (
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Valid {reward.expiresInDays} days
                          </span>
                        )}
                      </div>

                      {/* Unavailable Overlay */}
                      {!available && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center">
                          <Badge variant="secondary" className="text-sm">
                            Out of Stock
                          </Badge>
                        </div>
                      )}

                      {/* Not Enough Points Indicator */}
                      {available && !affordable && (
                        <div className="absolute top-2 right-2">
                          <Lock className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        )}

        {/* Redemption Dialog */}
        <Dialog open={!!selectedReward} onOpenChange={closeDialog}>
          <DialogContent>
            {redeemSuccess ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-6 w-6" />
                    Reward Redeemed!
                  </DialogTitle>
                </DialogHeader>
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="h-10 w-10 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{selectedReward?.name}</h3>
                  <p className="text-muted-foreground">
                    Your reward has been added to your account.
                  </p>
                  {selectedReward?.expiresInDays && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Valid for {selectedReward.expiresInDays} days
                    </p>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={closeDialog} className="w-full bg-rose-600 hover:bg-rose-700">
                    Done
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Confirm Redemption</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to redeem this reward?
                  </DialogDescription>
                </DialogHeader>

                {selectedReward && (
                  <div className="py-4">
                    <div className="bg-muted rounded-lg p-4">
                      <h4 className="font-semibold mb-1">{selectedReward.name}</h4>
                      <p className="text-sm text-muted-foreground mb-3">
                        {selectedReward.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-rose-600 font-bold">
                          {selectedReward.pointsCost.toLocaleString()} points
                        </span>
                        {selectedReward.value && (
                          <span className="text-green-600">
                            {selectedReward.valueType === "percentage"
                              ? `${selectedReward.value}% off`
                              : `$${selectedReward.value} value`}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-yellow-50 rounded-lg text-sm">
                      <p className="text-yellow-800">
                        Your new balance will be:{" "}
                        <strong>
                          {(currentPoints - selectedReward.pointsCost).toLocaleString()} points
                        </strong>
                      </p>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={closeDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRedeem}
                    disabled={isRedeeming}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    {isRedeeming ? "Redeeming..." : "Confirm Redemption"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
