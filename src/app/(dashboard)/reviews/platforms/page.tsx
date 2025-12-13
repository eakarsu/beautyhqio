"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Star,
  ExternalLink,
  Settings,
  RefreshCw,
} from "lucide-react";

interface Platform {
  id: string;
  name: string;
  icon: string;
  connected: boolean;
  rating: number;
  reviewCount: number;
  lastSync?: string;
  url?: string;
}

const platforms: Platform[] = [
  {
    id: "google",
    name: "Google Business",
    icon: "🔍",
    connected: true,
    rating: 4.8,
    reviewCount: 156,
    lastSync: "2 hours ago",
    url: "https://business.google.com",
  },
  {
    id: "yelp",
    name: "Yelp",
    icon: "📍",
    connected: true,
    rating: 4.5,
    reviewCount: 89,
    lastSync: "1 day ago",
    url: "https://biz.yelp.com",
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    connected: false,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "instagram",
    name: "Instagram",
    icon: "📸",
    connected: false,
    rating: 0,
    reviewCount: 0,
  },
  {
    id: "tripadvisor",
    name: "TripAdvisor",
    icon: "🦉",
    connected: false,
    rating: 0,
    reviewCount: 0,
  },
];

export default function ReviewPlatformsPage() {
  const router = useRouter();
  const [platformList, setPlatformList] = useState(platforms);

  const handleToggleConnection = (platformId: string) => {
    setPlatformList(
      platformList.map((p) =>
        p.id === platformId ? { ...p, connected: !p.connected } : p
      )
    );
  };

  const connectedPlatforms = platformList.filter((p) => p.connected);
  const avgRating =
    connectedPlatforms.length > 0
      ? connectedPlatforms.reduce((sum, p) => sum + p.rating, 0) /
        connectedPlatforms.length
      : 0;
  const totalReviews = connectedPlatforms.reduce(
    (sum, p) => sum + p.reviewCount,
    0
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reviews")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Review Platforms</h1>
            <p className="text-muted-foreground">
              Connect and manage your review platforms
            </p>
          </div>
        </div>
        <Button variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Sync All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Average Rating</p>
                <p className="text-xl font-bold">{avgRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Reviews</p>
                <p className="text-xl font-bold">{totalReviews}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Settings className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Connected</p>
                <p className="text-xl font-bold">
                  {connectedPlatforms.length} / {platformList.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platformList.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between p-4 rounded-lg border"
              >
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{platform.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{platform.name}</h3>
                      {platform.connected && (
                        <Badge variant="success">Connected</Badge>
                      )}
                    </div>
                    {platform.connected ? (
                      <div className="text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {platform.rating} ({platform.reviewCount} reviews)
                        </span>
                        <span>Last synced: {platform.lastSync}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Not connected</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {platform.connected && platform.url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(platform.url, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`connect-${platform.id}`}>
                      {platform.connected ? "Connected" : "Connect"}
                    </Label>
                    <Switch
                      id={`connect-${platform.id}`}
                      checked={platform.connected}
                      onCheckedChange={() =>
                        handleToggleConnection(platform.id)
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
