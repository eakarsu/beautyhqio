"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Store,
  Eye,
  ExternalLink,
  CheckCircle,
  Star,
} from "lucide-react";

interface Profile {
  id: string;
  slug: string;
  isListed: boolean;
  headline: string | null;
  description: string | null;
  specialties: string[];
  amenities: string[];
  priceRange: string | null;
  avgRating: number | null;
  reviewCount: number;
  viewCount: number;
  bookingClickCount: number;
  isVerified: boolean;
}

export default function MarketplaceSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [businessName, setBusinessName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/test-subscription")
      .then((res) => res.json())
      .then((data) => {
        console.log("Profile data:", data);
        if (data.profile) {
          setProfile(data.profile);
          setBusinessName(data.business?.name || "");
        } else {
          setError(data.error || "No profile found");
        }
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Profile</h1>
        <p>Loading profile data...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Profile</h1>
        <p className="text-red-500">Error: {error || "Profile not found"}</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace Profile</h1>
          <p className="text-gray-600">
            Manage how your salon appears on the BeautyHQ marketplace
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" asChild>
            <a href={`/salon/${profile.slug}`} target="_blank" rel="noopener noreferrer">
              <Eye className="h-4 w-4 mr-2" />
              Preview
              <ExternalLink className="h-3 w-3 ml-2" />
            </a>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.viewCount}</p>
              <p className="text-sm text-gray-500">Profile Views</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.bookingClickCount}</p>
              <p className="text-sm text-gray-500">Booking Clicks</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center flex items-center justify-center gap-1">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <p className="text-2xl font-bold">
                {profile.avgRating?.toFixed(1) || "-"}
              </p>
            </div>
            <p className="text-sm text-gray-500 text-center">Average Rating</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{profile.reviewCount}</p>
              <p className="text-sm text-gray-500">Reviews</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visibility */}
      <Card>
        <CardHeader>
          <CardTitle>Visibility</CardTitle>
          <CardDescription>
            Control whether your salon appears in the marketplace
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="font-medium">List on Marketplace</p>
              <p className="text-sm text-gray-500">
                When enabled, your salon will be visible to consumers searching on BeautyHQ
              </p>
            </div>
            <Switch checked={profile.isListed} disabled />
          </div>
          {profile.isVerified && (
            <div className="mt-4 flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Verified Business</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>
            The main details shown on your marketplace profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={businessName} disabled />
            </div>
            <div className="space-y-2">
              <Label>Profile URL</Label>
              <div className="flex">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                  /salon/
                </span>
                <Input
                  value={profile.slug}
                  disabled
                  className="rounded-l-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Headline</Label>
            <Input
              value={profile.headline || ""}
              disabled
              placeholder="A short catchy headline for your salon"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={profile.description || ""}
              disabled
              placeholder="Tell customers about your salon..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>Price Range</Label>
            <Input value={profile.priceRange || "Not set"} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Specialties */}
      <Card>
        <CardHeader>
          <CardTitle>Specialties</CardTitle>
          <CardDescription>
            What your salon specializes in
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.specialties.length > 0 ? (
              profile.specialties.map((specialty, index) => (
                <Badge key={index} variant="secondary">
                  {specialty}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No specialties set</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Amenities */}
      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
          <CardDescription>
            Amenities your salon offers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {profile.amenities.length > 0 ? (
              profile.amenities.map((amenity, index) => (
                <Badge key={index} variant="outline">
                  {amenity}
                </Badge>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No amenities set</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
