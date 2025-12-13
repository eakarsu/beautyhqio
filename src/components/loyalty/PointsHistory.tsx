"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Minus, Gift, Calendar, ShoppingBag, Star, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { format } from "date-fns";

interface PointTransaction {
  id: string;
  type: "earned" | "redeemed" | "expired" | "bonus" | "referral";
  points: number;
  description: string;
  date: string;
  balance: number;
  relatedId?: string;
  relatedType?: string;
}

interface PointsHistoryProps {
  clientId: string;
  limit?: number;
}

const TRANSACTION_ICONS = {
  earned: ShoppingBag,
  redeemed: Gift,
  expired: Calendar,
  bonus: Star,
  referral: ArrowUpRight,
};

const TRANSACTION_COLORS = {
  earned: "bg-green-100 text-green-800",
  redeemed: "bg-blue-100 text-blue-800",
  expired: "bg-gray-100 text-gray-800",
  bonus: "bg-yellow-100 text-yellow-800",
  referral: "bg-purple-100 text-purple-800",
};

export function PointsHistory({ clientId, limit }: PointsHistoryProps) {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [clientId]);

  const fetchHistory = async () => {
    try {
      const params = new URLSearchParams();
      if (limit) params.append("limit", limit.toString());

      const response = await fetch(`/api/clients/${clientId}/loyalty/history?${params}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching points history:", error);
      // Demo data
      setTransactions([
        {
          id: "t1",
          type: "earned",
          points: 85,
          description: "Haircut & Style service",
          date: new Date().toISOString(),
          balance: 1850,
        },
        {
          id: "t2",
          type: "redeemed",
          points: -500,
          description: "Free conditioning treatment",
          date: new Date(Date.now() - 86400000 * 3).toISOString(),
          balance: 1765,
        },
        {
          id: "t3",
          type: "earned",
          points: 150,
          description: "Color treatment service",
          date: new Date(Date.now() - 86400000 * 7).toISOString(),
          balance: 2265,
        },
        {
          id: "t4",
          type: "bonus",
          points: 200,
          description: "Birthday bonus points",
          date: new Date(Date.now() - 86400000 * 14).toISOString(),
          balance: 2115,
        },
        {
          id: "t5",
          type: "referral",
          points: 100,
          description: "Friend referral bonus (Maria G.)",
          date: new Date(Date.now() - 86400000 * 21).toISOString(),
          balance: 1915,
        },
        {
          id: "t6",
          type: "earned",
          points: 65,
          description: "Product purchase",
          date: new Date(Date.now() - 86400000 * 28).toISOString(),
          balance: 1815,
        },
        {
          id: "t7",
          type: "expired",
          points: -150,
          description: "Points expired (unused for 12 months)",
          date: new Date(Date.now() - 86400000 * 35).toISOString(),
          balance: 1750,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getPointsDisplay = (transaction: PointTransaction) => {
    const isPositive = transaction.points > 0;
    return (
      <span
        className={`font-bold ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        {isPositive ? "+" : ""}
        {transaction.points.toLocaleString()}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Points History
        </CardTitle>
        <CardDescription>Track how you earn and redeem points</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading history...
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No points activity yet</p>
            <p className="text-sm">Start earning points with your next visit!</p>
          </div>
        ) : (
          <ScrollArea className={limit ? "h-[300px]" : "h-[500px]"}>
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const Icon = TRANSACTION_ICONS[transaction.type];
                const colorClass = TRANSACTION_COLORS[transaction.type];

                return (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {transaction.points > 0 ? (
                          <ArrowUpRight className="h-4 w-4 text-green-600" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4 text-red-600" />
                        )}
                        {getPointsDisplay(transaction)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Balance: {transaction.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
