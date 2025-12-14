"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Plus, Search, Gift, Trash2 } from "lucide-react";

interface LoyaltyReward {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  type: string;
  value: number | string;
  isActive: boolean;
}

export default function ManageRewardsPage() {
  const router = useRouter();
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/loyalty/rewards/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setRewards(rewards.filter(r => r.id !== id));
        setDeleteId(null);
      } else {
        alert("Failed to delete reward");
      }
    } catch (error) {
      console.error("Error deleting reward:", error);
      alert("Failed to delete reward");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchRewards() {
      try {
        const businessRes = await fetch("/api/business");
        const businesses = await businessRes.json();
        const businessId = businesses[0]?.id;

        if (businessId) {
          const programRes = await fetch(`/api/loyalty?businessId=${businessId}`);
          if (programRes.ok) {
            const program = await programRes.json();
            if (program?.rewards) {
              setRewards(program.rewards);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching rewards:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchRewards();
  }, []);

  const filteredRewards = rewards.filter((reward) =>
    reward.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTypeLabel = (type: string) => {
    switch (type.toLowerCase()) {
      case "discount":
      case "discount_amount":
        return "$ Off";
      case "percentage":
      case "discount_percent":
        return "% Off";
      case "free_service":
        return "Free Service";
      case "free_product":
        return "Free Product";
      case "perk":
        return "Perk";
      default:
        return "Custom";
    }
  };

  const toNumber = (val: number | string | undefined): number => {
    if (val === undefined || val === null) return 0;
    return typeof val === "string" ? parseFloat(val) : val;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/loyalty")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Rewards</h1>
            <p className="text-slate-500 mt-1">
              View and manage all loyalty rewards
            </p>
          </div>
        </div>
        <Button onClick={() => router.push("/loyalty/rewards/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Reward
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="h-5 w-5" />
              All Rewards ({rewards.length})
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Loading rewards...</div>
          ) : filteredRewards.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              {searchQuery ? "No rewards match your search" : "No rewards yet. Add your first reward!"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Points Cost</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRewards.map((reward) => (
                  <TableRow key={reward.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/loyalty/rewards/${reward.id}`)}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{reward.name}</p>
                        {reward.description && (
                          <p className="text-sm text-slate-500 truncate max-w-xs">
                            {reward.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getTypeLabel(reward.type)}</Badge>
                    </TableCell>
                    <TableCell>
                      {toNumber(reward.value) > 0 ? (
                        reward.type.toLowerCase().includes("percent") ? (
                          `${toNumber(reward.value)}%`
                        ) : (
                          `$${toNumber(reward.value)}`
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{reward.pointsCost} pts</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={reward.isActive ? "success" : "destructive"}>
                        {reward.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(reward.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Reward</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this reward? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteId(null)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
