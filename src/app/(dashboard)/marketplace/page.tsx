"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Store, Eye, MousePointer, Star, CheckCircle, Trash2 } from "lucide-react";

interface Profile {
  id: string;
  businessName: string;
  businessType: string;
  slug: string;
  isListed: boolean;
  headline: string | null;
  specialties: string[];
  amenities: string[];
  priceRange: string | null;
  avgRating: number | null;
  reviewCount: number;
  viewCount: number;
  bookingClickCount: number;
  isVerified: boolean;
}

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleDeleteProfile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/all-marketplace/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProfiles(profiles.filter(p => p.id !== id));
        setSelectedProfile(null);
      } else {
        const data = await res.json();
        alert(data.error || "Failed to delete");
      }
    } catch (err) {
      alert("Failed to delete profile");
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    fetch("/api/all-marketplace")
      .then((res) => res.json())
      .then((data) => {
        if (data.profiles) {
          setProfiles(data.profiles);
        } else {
          setError(data.error || "No profiles found");
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Profiles</h1>
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Marketplace Profiles</h1>
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  // Stats
  const totalViews = profiles.reduce((sum, p) => sum + p.viewCount, 0);
  const totalClicks = profiles.reduce((sum, p) => sum + p.bookingClickCount, 0);
  const verifiedCount = profiles.filter(p => p.isVerified).length;
  const avgRating = profiles.filter(p => p.avgRating).reduce((sum, p) => sum + (p.avgRating || 0), 0) / profiles.filter(p => p.avgRating).length;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Marketplace Profiles</h1>
        <p className="text-gray-600">All businesses listed on BeautyHQ marketplace</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Store className="h-8 w-8 text-rose-500" />
              <div>
                <p className="text-sm text-gray-500">Total Profiles</p>
                <p className="text-2xl font-bold">{profiles.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Eye className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Total Views</p>
                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <MousePointer className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-500">Total Clicks</p>
                <p className="text-2xl font-bold">{totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Verified</p>
                <p className="text-2xl font-bold">{verifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profiles Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Marketplace Profiles ({profiles.length})</CardTitle>
          <CardDescription>Click on a row to see details</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Reviews</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow
                  key={profile.id}
                  className="cursor-pointer hover:bg-gray-50"
                  onClick={() => setSelectedProfile(profile)}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{profile.businessName}</span>
                      {profile.isVerified && (
                        <CheckCircle className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{profile.headline || "-"}</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{profile.businessType.replace(/_/g, " ")}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span>{profile.avgRating?.toFixed(1) || "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell>{profile.reviewCount}</TableCell>
                  <TableCell>{profile.viewCount.toLocaleString()}</TableCell>
                  <TableCell>{profile.bookingClickCount}</TableCell>
                  <TableCell>{profile.priceRange || "-"}</TableCell>
                  <TableCell>
                    <Badge className={profile.isListed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {profile.isListed ? "Listed" : "Unlisted"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Profile Detail Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedProfile?.businessName}
              {selectedProfile?.isVerified && (
                <CheckCircle className="h-5 w-5 text-blue-500" />
              )}
            </DialogTitle>
            <DialogDescription>
              {selectedProfile?.headline || "Marketplace Profile"}
            </DialogDescription>
          </DialogHeader>
          {selectedProfile && (
            <div className="space-y-6">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{selectedProfile.viewCount.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Views</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{selectedProfile.bookingClickCount}</p>
                  <p className="text-sm text-gray-500">Clicks</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                    <p className="text-2xl font-bold">{selectedProfile.avgRating?.toFixed(1) || "-"}</p>
                  </div>
                  <p className="text-sm text-gray-500">Rating</p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold">{selectedProfile.reviewCount}</p>
                  <p className="text-sm text-gray-500">Reviews</p>
                </div>
              </div>

              {/* Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Business Type</p>
                  <p className="font-medium">{selectedProfile.businessType.replace(/_/g, " ")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Price Range</p>
                  <p className="font-medium">{selectedProfile.priceRange || "Not set"}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profile URL</p>
                  <p className="font-medium">/salon/{selectedProfile.slug}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge className={selectedProfile.isListed ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {selectedProfile.isListed ? "Listed" : "Unlisted"}
                  </Badge>
                </div>
              </div>

              {/* Specialties */}
              {selectedProfile.specialties.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Specialties</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.specialties.map((s, i) => (
                      <Badge key={i} variant="secondary">{s}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Amenities */}
              {selectedProfile.amenities.length > 0 && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.amenities.map((a, i) => (
                      <Badge key={i} variant="outline">{a}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t">
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteProfile(selectedProfile.id)}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? "Deleting..." : "Delete Profile"}
                </Button>
                <Button variant="outline" onClick={() => setSelectedProfile(null)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
