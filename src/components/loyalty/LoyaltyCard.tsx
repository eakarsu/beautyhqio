"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Crown, Star, Gift, Sparkles } from "lucide-react";

interface LoyaltyData {
  clientId: string;
  clientName: string;
  tier: "bronze" | "silver" | "gold" | "platinum";
  currentPoints: number;
  lifetimePoints: number;
  pointsToNextTier: number;
  nextTier?: string;
  memberSince: string;
  availableRewards: number;
}

interface LoyaltyCardProps {
  clientId: string;
  compact?: boolean;
}

const TIER_CONFIG = {
  bronze: {
    color: "from-amber-600 to-amber-800",
    textColor: "text-amber-100",
    icon: Star,
    label: "Bronze Member",
    minPoints: 0,
  },
  silver: {
    color: "from-slate-400 to-slate-600",
    textColor: "text-slate-100",
    icon: Star,
    label: "Silver Member",
    minPoints: 500,
  },
  gold: {
    color: "from-yellow-500 to-yellow-700",
    textColor: "text-yellow-100",
    icon: Crown,
    label: "Gold Member",
    minPoints: 1500,
  },
  platinum: {
    color: "from-purple-500 to-purple-700",
    textColor: "text-purple-100",
    icon: Sparkles,
    label: "Platinum Member",
    minPoints: 5000,
  },
};

export function LoyaltyCard({ clientId, compact = false }: LoyaltyCardProps) {
  const [data, setData] = useState<LoyaltyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLoyaltyData();
  }, [clientId]);

  const fetchLoyaltyData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/loyalty`);
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Error fetching loyalty data:", error);
      // Demo data
      setData({
        clientId,
        clientName: "Jane Doe",
        tier: "gold",
        currentPoints: 1850,
        lifetimePoints: 3200,
        pointsToNextTier: 3150,
        nextTier: "Platinum",
        memberSince: "2023-06-15",
        availableRewards: 2,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="h-32 bg-muted" />
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const tierConfig = TIER_CONFIG[data.tier];
  const TierIcon = tierConfig.icon;
  const progressToNext = data.nextTier
    ? ((data.currentPoints - TIER_CONFIG[data.tier].minPoints) /
        (data.pointsToNextTier - TIER_CONFIG[data.tier].minPoints)) *
      100
    : 100;

  if (compact) {
    return (
      <div
        className={`bg-gradient-to-r ${tierConfig.color} rounded-lg p-3 ${tierConfig.textColor}`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TierIcon className="h-5 w-5" />
            <span className="font-medium">{tierConfig.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{data.currentPoints.toLocaleString()} pts</span>
            {data.availableRewards > 0 && (
              <Badge className="bg-white/20">
                <Gift className="h-3 w-3 mr-1" />
                {data.availableRewards}
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className={`bg-gradient-to-br ${tierConfig.color} p-6 ${tierConfig.textColor}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <TierIcon className="h-6 w-6" />
              <span className="text-lg font-bold">{tierConfig.label}</span>
            </div>
            <p className="text-sm opacity-80">{data.clientName}</p>
          </div>
          {data.availableRewards > 0 && (
            <Badge className="bg-white/20 text-white border-white/30">
              <Gift className="h-3 w-3 mr-1" />
              {data.availableRewards} Rewards
            </Badge>
          )}
        </div>

        {/* Points Display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-bold tracking-tight">
            {data.currentPoints.toLocaleString()}
          </div>
          <div className="text-sm opacity-80">Available Points</div>
        </div>

        {/* Progress to Next Tier */}
        {data.nextTier && (
          <div className="bg-black/20 rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span>{tierConfig.label}</span>
              <span>{data.nextTier}</span>
            </div>
            <Progress value={progressToNext} className="h-2 bg-white/20" />
            <p className="text-xs text-center mt-2 opacity-80">
              {data.pointsToNextTier - data.currentPoints} points to {data.nextTier}
            </p>
          </div>
        )}
      </div>

      {/* Stats */}
      <CardContent className="p-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-rose-600">
              {data.lifetimePoints.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Lifetime Points</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-rose-600">
              {new Date(data.memberSince).getFullYear()}
            </div>
            <div className="text-xs text-muted-foreground">Member Since</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
