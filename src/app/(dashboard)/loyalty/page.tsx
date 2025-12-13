"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Plus,
  Star,
  Gift,
  TrendingUp,
  Users,
  Award,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

interface LoyaltyReward {
  id: string;
  name: string;
  pointsCost: number;
  redemptionCount?: number;
}

interface LoyaltyAccount {
  id: string;
  pointsBalance: number;
  lifetimePoints: number;
  tier: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

interface LoyaltyProgram {
  id: string;
  name: string;
  pointsPerDollar: number;
  tiers?: any;
  rewards: LoyaltyReward[];
  accounts: LoyaltyAccount[];
}

// Static tiers for now - could be moved to database later
const staticTiers = [
  {
    id: "1",
    name: "Bronze",
    minPoints: 0,
    multiplier: 1,
    color: "#CD7F32",
    benefits: ["1 point per $1", "Birthday reward"],
  },
  {
    id: "2",
    name: "Silver",
    minPoints: 500,
    multiplier: 1.25,
    color: "#C0C0C0",
    benefits: ["1.25x points", "Early access to sales", "Free shipping"],
  },
  {
    id: "3",
    name: "Gold",
    minPoints: 1500,
    multiplier: 1.5,
    color: "#FFD700",
    benefits: ["1.5x points", "Priority booking", "Exclusive events"],
  },
  {
    id: "4",
    name: "Platinum",
    minPoints: 5000,
    multiplier: 2,
    color: "#E5E4E2",
    benefits: ["2x points", "Free upgrades", "Personal stylist"],
  },
];

export default function LoyaltyPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [program, setProgram] = useState<LoyaltyProgram | null>(null);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchLoyaltyData() {
      try {
        // First get business ID
        const businessRes = await fetch("/api/business");
        const businesses = await businessRes.json();
        const businessId = businesses[0]?.id;

        if (businessId) {
          // Fetch loyalty program with accounts
          const programRes = await fetch(`/api/loyalty?businessId=${businessId}`);
          if (programRes.ok) {
            const programData = await programRes.json();
            setProgram(programData);
            if (programData?.rewards) {
              setRewards(programData.rewards);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching loyalty data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoyaltyData();
  }, []);

  const getTierColor = (tier: string) => {
    const tierData = staticTiers.find((t) => t.name === tier);
    return tierData?.color || "#C0C0C0";
  };

  // Calculate stats from actual data
  const totalMembers = program?.accounts?.length || 0;
  const totalPointsIssued = program?.accounts?.reduce((sum, acc) => sum + acc.lifetimePoints, 0) || 0;
  const totalPointsBalance = program?.accounts?.reduce((sum, acc) => sum + acc.pointsBalance, 0) || 0;
  const pointsRedeemed = totalPointsIssued - totalPointsBalance;

  // Calculate tier counts
  const tierCounts = staticTiers.map((tier) => ({
    ...tier,
    members: program?.accounts?.filter((acc) => acc.tier === tier.name).length || 0,
  }));

  // Filter members by search
  const filteredMembers = program?.accounts?.filter((account) => {
    const name = `${account.client.firstName} ${account.client.lastName}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  }) || [];

  // Sort by lifetime points (top members)
  const topMembers = [...filteredMembers].sort((a, b) => b.lifetimePoints - a.lifetimePoints).slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Loyalty Program</h1>
          <p className="text-slate-500 mt-1">
            Manage rewards and member benefits
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/loyalty/rewards/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Reward
          </Button>
          <Button onClick={() => router.push("/loyalty/issue")}>
            <Gift className="h-4 w-4 mr-2" />
            Issue Points
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading loyalty data...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/clients?filter=loyalty")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Members</p>
                    <p className="text-xl font-bold">
                      {totalMembers.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/reports?type=loyalty")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Active Balance</p>
                    <p className="text-xl font-bold">
                      {totalPointsBalance.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/loyalty/issue")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Points Issued</p>
                    <p className="text-xl font-bold">
                      {totalPointsIssued.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push("/loyalty/rewards")}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                    <Gift className="h-5 w-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Points Redeemed</p>
                    <p className="text-xl font-bold">
                      {pointsRedeemed.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tiers */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Membership Tiers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {tierCounts.map((tier) => (
                    <div
                      key={tier.id}
                      className="p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                      style={{ borderColor: tier.color }}
                      onClick={() => router.push(`/clients?tier=${tier.name}`)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: tier.color }}
                          />
                          <h3 className="font-semibold">{tier.name}</h3>
                        </div>
                        <Badge variant="outline">{tier.members} members</Badge>
                      </div>
                      <p className="text-sm text-slate-500 mb-2">
                        Min {tier.minPoints.toLocaleString()} points
                      </p>
                      <div className="space-y-1">
                        {tier.benefits.map((benefit, idx) => (
                          <p key={idx} className="text-sm flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-500" />
                            {benefit}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Rewards */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Available Rewards
                  </CardTitle>
                  <Badge variant="outline">{rewards.length} total</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {rewards.length === 0 ? (
                  <div className="text-center py-4 text-slate-500">
                    No rewards yet. Add your first reward!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {rewards.slice(0, 5).map((reward) => (
                      <div
                        key={reward.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-50 cursor-pointer hover:bg-slate-100"
                        onClick={() => router.push("/loyalty/rewards")}
                      >
                        <div>
                          <p className="font-medium text-sm">{reward.name}</p>
                          <p className="text-xs text-slate-500">
                            {reward.redemptionCount || 0} redemptions
                          </p>
                        </div>
                        <Badge variant="secondary">{reward.pointsCost} pts</Badge>
                      </div>
                    ))}
                    {rewards.length > 5 && (
                      <p className="text-xs text-center text-slate-500">
                        +{rewards.length - 5} more rewards
                      </p>
                    )}
                  </div>
                )}
                <Button variant="outline" className="w-full mt-4" size="sm" onClick={() => router.push("/loyalty/rewards")}>
                  View All Rewards ({rewards.length})
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Top Members */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Top Members</CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {topMembers.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No loyalty members yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Tier</TableHead>
                      <TableHead>Points Balance</TableHead>
                      <TableHead>Lifetime Points</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topMembers.map((account) => (
                      <TableRow key={account.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/clients/${account.client.id}`)}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {getInitials(
                                  account.client.firstName,
                                  account.client.lastName
                                )}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{account.client.firstName} {account.client.lastName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: getTierColor(account.tier) }}
                            />
                            {account.tier}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">
                            {account.pointsBalance.toLocaleString()}
                          </span>
                          <span className="text-slate-500"> pts</span>
                        </TableCell>
                        <TableCell>{account.lifetimePoints.toLocaleString()} pts</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/clients/${account.client.id}`); }}>
                            View Profile
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
