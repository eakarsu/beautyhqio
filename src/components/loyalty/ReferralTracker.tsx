"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Gift,
  Copy,
  Share2,
  CheckCircle,
  Clock,
  UserPlus,
  Mail,
  MessageSquare,
} from "lucide-react";

interface Referral {
  id: string;
  referredName: string;
  status: "pending" | "completed" | "expired";
  pointsEarned?: number;
  createdAt: string;
  completedAt?: string;
}

interface ReferralProgram {
  referralCode: string;
  referralLink: string;
  pointsPerReferral: number;
  friendDiscount: number;
  friendDiscountType: "fixed" | "percentage";
  totalReferrals: number;
  totalPointsEarned: number;
  referrals: Referral[];
}

interface ReferralTrackerProps {
  clientId: string;
}

export function ReferralTracker({ clientId }: ReferralTrackerProps) {
  const [program, setProgram] = useState<ReferralProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchReferralProgram();
  }, [clientId]);

  const fetchReferralProgram = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}/referrals`);
      if (response.ok) {
        const data = await response.json();
        setProgram(data);
      }
    } catch (error) {
      console.error("Error fetching referral program:", error);
      // Demo data
      setProgram({
        referralCode: "JANE2024",
        referralLink: "https://salon.com/ref/JANE2024",
        pointsPerReferral: 100,
        friendDiscount: 15,
        friendDiscountType: "percentage",
        totalReferrals: 5,
        totalPointsEarned: 400,
        referrals: [
          {
            id: "ref1",
            referredName: "Maria Garcia",
            status: "completed",
            pointsEarned: 100,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          },
          {
            id: "ref2",
            referredName: "John Smith",
            status: "completed",
            pointsEarned: 100,
            createdAt: new Date(Date.now() - 86400000 * 21).toISOString(),
            completedAt: new Date(Date.now() - 86400000 * 14).toISOString(),
          },
          {
            id: "ref3",
            referredName: "Emily Chen",
            status: "pending",
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          },
          {
            id: "ref4",
            referredName: "Alex Wilson",
            status: "completed",
            pointsEarned: 100,
            createdAt: new Date(Date.now() - 86400000 * 45).toISOString(),
            completedAt: new Date(Date.now() - 86400000 * 40).toISOString(),
          },
          {
            id: "ref5",
            referredName: "Sarah Brown",
            status: "expired",
            createdAt: new Date(Date.now() - 86400000 * 90).toISOString(),
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleSendInvite = async () => {
    setIsSending(true);
    try {
      await fetch(`/api/clients/${clientId}/referrals/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail }),
      });
      setInviteEmail("");
      setShowInviteDialog(false);
    } catch (error) {
      console.error("Error sending invite:", error);
    } finally {
      setIsSending(false);
    }
  };

  const getStatusBadge = (status: Referral["status"]) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "expired":
        return (
          <Badge variant="secondary">
            Expired
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading referral program...
        </CardContent>
      </Card>
    );
  }

  if (!program) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Refer Friends
        </CardTitle>
        <CardDescription>
          Invite friends and earn rewards when they visit
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reward Info */}
        <div className="bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-rose-600">
                {program.pointsPerReferral}
              </div>
              <div className="text-sm text-muted-foreground">Points for You</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-rose-600">
                {program.friendDiscountType === "percentage"
                  ? `${program.friendDiscount}%`
                  : `$${program.friendDiscount}`}
              </div>
              <div className="text-sm text-muted-foreground">Off for Friends</div>
            </div>
          </div>
        </div>

        {/* Referral Code */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Your Referral Code</label>
          <div className="flex gap-2">
            <Input
              value={program.referralCode}
              readOnly
              className="font-mono text-lg text-center"
            />
            <Button
              variant="outline"
              onClick={() => copyToClipboard(program.referralCode)}
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-rose-600 hover:bg-rose-700"
            onClick={() => copyToClipboard(program.referralLink)}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Copy Link
          </Button>
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Mail className="h-4 w-4 mr-2" />
                Email Invite
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Send Email Invite</DialogTitle>
                <DialogDescription>
                  Send a personalized referral invite to your friend
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <Input
                  type="email"
                  placeholder="friend@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSendInvite}
                  disabled={!inviteEmail || isSending}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  {isSending ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold">{program.totalReferrals}</div>
              <div className="text-xs text-muted-foreground">Total Referrals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {program.totalPointsEarned}
              </div>
              <div className="text-xs text-muted-foreground">Points Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral History */}
        <div>
          <h4 className="font-medium mb-3">Referral History</h4>
          {program.referrals.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No referrals yet</p>
              <p className="text-xs">Share your code to start earning!</p>
            </div>
          ) : (
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {program.referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{referral.referredName}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(referral.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {referral.pointsEarned && (
                        <span className="text-green-600 font-medium">
                          +{referral.pointsEarned}
                        </span>
                      )}
                      {getStatusBadge(referral.status)}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
