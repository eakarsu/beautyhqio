"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Gift, Star, Trophy, ArrowRight } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string;
  pointsCost: number;
  image: string | null;
}

interface LoyaltyAccount {
  pointsBalance: number;
  lifetimePoints: number;
  tier: string;
}

export default function RewardsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [account, setAccount] = useState<LoyaltyAccount | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isClient) {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      fetchRewardsData();
    }
  }, [session, status, router]);

  const fetchRewardsData = async () => {
    try {
      const [accountRes, rewardsRes] = await Promise.all([
        fetch("/api/client/loyalty"),
        fetch("/api/client/rewards"),
      ]);

      if (accountRes.ok) {
        const accountData = await accountRes.json();
        setAccount(accountData.account);
      }

      if (rewardsRes.ok) {
        const rewardsData = await rewardsRes.json();
        setRewards(rewardsData.rewards || []);
      }
    } catch (error) {
      console.error("Error fetching rewards data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: string) => {
    if (!confirm("Are you sure you want to redeem this reward?")) return;
    try {
      const response = await fetch(`/api/client/rewards/${rewardId}/redeem`, {
        method: "POST",
      });
      if (response.ok) {
        alert("Reward redeemed successfully!");
        fetchRewardsData();
      }
    } catch (error) {
      console.error("Error redeeming reward:", error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "Platinum":
        return "from-slate-600 to-slate-800";
      case "Gold":
        return "from-yellow-500 to-yellow-600";
      case "Silver":
        return "from-slate-300 to-slate-400";
      default:
        return "from-amber-600 to-amber-700";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My Rewards</h1>
        <p className="text-slate-600">Earn points and redeem exclusive rewards</p>
      </div>

      {/* Points Card */}
      <div
        className={`bg-gradient-to-br ${getTierColor(
          account?.tier || "Bronze"
        )} rounded-2xl p-6 text-white max-w-md`}
      >
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="h-5 w-5" />
          <span className="font-medium">{account?.tier || "Bronze"} Member</span>
        </div>
        <div className="mb-4">
          <p className="text-sm opacity-80">Available Points</p>
          <p className="text-4xl font-bold">{account?.pointsBalance || 0}</p>
        </div>
        <div className="text-sm opacity-80">
          Lifetime points earned: {account?.lifetimePoints || 0}
        </div>
      </div>

      {/* How to Earn */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          How to Earn Points
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Star className="h-5 w-5 text-rose-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Book Services</p>
              <p className="text-sm text-slate-500">
                Earn 1 point per $1 spent
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Gift className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Refer Friends</p>
              <p className="text-sm text-slate-500">
                Get 100 points per referral
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Birthday Bonus</p>
              <p className="text-sm text-slate-500">
                50 bonus points on your birthday
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Available Rewards */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-4">
          Available Rewards
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rewards.length > 0 ? (
            rewards.map((reward) => (
              <div
                key={reward.id}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow"
              >
                <div className="h-24 bg-gradient-to-br from-rose-50 to-purple-50 rounded-lg flex items-center justify-center mb-3">
                  <Gift className="h-10 w-10 text-rose-400" />
                </div>
                <h3 className="font-medium text-slate-900">{reward.name}</h3>
                {reward.description && (
                  <p className="text-sm text-slate-500 mt-1">
                    {reward.description}
                  </p>
                )}
                <div className="flex items-center justify-between mt-3">
                  <span className="text-sm font-medium text-rose-600">
                    {reward.pointsCost} points
                  </span>
                  <button
                    onClick={() => handleRedeem(reward.id)}
                    disabled={(account?.pointsBalance || 0) < reward.pointsCost}
                    className="flex items-center gap-1 text-sm text-rose-600 hover:text-rose-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                  >
                    Redeem <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-slate-500">
              <Gift className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p>No rewards available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
