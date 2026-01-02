"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
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
import {
  Search,
  Plus,
  Gift,
  DollarSign,
  CreditCard,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface GiftCard {
  id: string;
  code: string;
  initialBalance: number | string;
  currentBalance: number | string;
  status: string;
  recipientName?: string;
  recipientEmail?: string;
  purchasedBy?: {
    firstName: string;
    lastName: string;
    email?: string;
  };
  expiresAt?: string;
  purchasedAt: string;
  lastUsedAt?: string;
}

export default function GiftCardsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check if user is staff or receptionist (limited permissions)
  const isLimitedRole = session?.user?.role === "STAFF" || session?.user?.role === "RECEPTIONIST";

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/gift-cards/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setGiftCards(giftCards.filter(g => g.id !== id));
        setDeleteId(null);
      } else {
        alert("Failed to delete gift card");
      }
    } catch (error) {
      console.error("Error deleting gift card:", error);
      alert("Failed to delete gift card");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchGiftCards() {
      try {
        const response = await fetch("/api/gift-cards");
        if (response.ok) {
          const data = await response.json();
          setGiftCards(data);
        }
      } catch (error) {
        console.error("Error fetching gift cards:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchGiftCards();
  }, []);

  const getStatusVariant = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "success";
      case "REDEEMED":
        return "secondary";
      case "EXPIRED":
        return "destructive";
      default:
        return "outline";
    }
  };

  const filteredCards = giftCards.filter(
    (card) =>
      card.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (card.purchasedBy && `${card.purchasedBy.firstName} ${card.purchasedBy.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (card.recipientName?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Helper to convert Decimal to number
  const toNumber = (val: number | string | undefined): number => {
    if (val === undefined || val === null) return 0;
    return typeof val === "string" ? parseFloat(val) : val;
  };

  // Calculate stats from actual data
  const totalSold = giftCards.length;
  const totalValue = giftCards.reduce((sum, card) => sum + toNumber(card.initialBalance), 0);
  const outstanding = giftCards
    .filter((c) => c.status.toUpperCase() === "ACTIVE")
    .reduce((sum, card) => sum + toNumber(card.currentBalance), 0);
  const redeemed = totalValue - outstanding;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gift Cards</h1>
          <p className="text-slate-500 mt-1">
            Sell and manage gift cards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => router.push("/gift-cards/check-balance")}>
            <Search className="h-4 w-4 mr-2" />
            Check Balance
          </Button>
          <Button onClick={() => router.push("/gift-cards/new")}>
            <Plus className="h-4 w-4 mr-2" />
            New Gift Card
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/gift-cards/new")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Gift className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Cards Sold</p>
                <p className="text-xl font-bold">{totalSold}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/reports?type=gift-cards")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Value Sold</p>
                <p className="text-xl font-bold">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/gift-cards/check-balance")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Outstanding</p>
                <p className="text-xl font-bold">
                  {formatCurrency(outstanding)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/pos")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-rose-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Redeemed</p>
                <p className="text-xl font-bold">
                  {formatCurrency(redeemed)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Gift Card List */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Gift Cards</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by code, buyer, recipient..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-80"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading gift cards...</div>
            ) : filteredCards.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No gift cards yet. Create your first gift card!
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Original</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    {!isLimitedRole && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCards.map((card) => (
                    <TableRow key={card.id} className="cursor-pointer hover:bg-slate-50" onClick={() => router.push(`/gift-cards/${card.id}`)}>
                      <TableCell className="font-mono text-sm">
                        {card.code}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">{card.recipientName || "N/A"}</p>
                          {card.recipientEmail && (
                            <p className="text-xs text-slate-500">
                              {card.recipientEmail}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(toNumber(card.initialBalance))}</TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(toNumber(card.currentBalance))}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(card.status)}>
                          {card.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {formatDate(new Date(card.purchasedAt))}
                      </TableCell>
                      {!isLimitedRole && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(card.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Quick Amounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[25, 50, 75, 100, 150, 200].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    className="h-12"
                    onClick={() => router.push(`/gift-cards/new?amount=${amount}`)}
                  >
                    {formatCurrency(amount)}
                  </Button>
                ))}
              </div>
              <Button className="w-full mt-3" onClick={() => router.push("/gift-cards/new")}>Custom Amount</Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Gift Card</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this gift card? This action cannot be undone.
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
