"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ThumbsUp,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  Flag,
  Trash2,
} from "lucide-react";
import { formatDate, getInitials } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  source: string;
  isPublic: boolean;
  response?: string;
  respondedAt?: string;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
  };
}

export default function ReviewsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/reviews/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setReviews(reviews.filter(r => r.id !== id));
        setDeleteId(null);
      } else {
        alert("Failed to delete review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      alert("Failed to delete review");
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    async function fetchReviews() {
      try {
        const response = await fetch("/api/reviews");
        if (response.ok) {
          const data = await response.json();
          setReviews(data);
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchReviews();
  }, []);

  // Calculate stats from actual data
  const totalReviews = reviews.length;
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  // This month
  const now = new Date();
  const thisMonthReviews = reviews.filter((r) => {
    const reviewDate = new Date(r.createdAt);
    return reviewDate.getMonth() === now.getMonth() && reviewDate.getFullYear() === now.getFullYear();
  }).length;

  // Response rate
  const respondedReviews = reviews.filter((r) => r.response).length;
  const responseRate = reviews.length > 0 ? Math.round((respondedReviews / reviews.length) * 100) : 0;

  // Platform stats
  const platformCounts = reviews.reduce((acc, r) => {
    const source = r.source.toUpperCase();
    if (!acc[source]) {
      acc[source] = { count: 0, totalRating: 0 };
    }
    acc[source].count++;
    acc[source].totalRating += r.rating;
    return acc;
  }, {} as Record<string, { count: number; totalRating: number }>);

  const platformStats = Object.entries(platformCounts).map(([platform, data]) => ({
    platform,
    rating: (data.totalRating / data.count).toFixed(1),
    reviews: data.count,
    icon: platform.charAt(0),
  }));

  const filteredReviews =
    filter === "all"
      ? reviews
      : filter === "pending"
      ? reviews.filter((r) => !r.response)
      : reviews.filter((r) => r.rating.toString() === filter);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "text-amber-500 fill-amber-500"
                : "text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reviews</h1>
          <p className="text-slate-500 mt-1">
            Monitor and respond to client feedback
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/reviews/platforms")}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View All Platforms
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-slate-500">Loading reviews...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("5")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-amber-600 fill-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Average Rating</p>
                    <p className="text-xl font-bold">{averageRating}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("all")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <ThumbsUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Total Reviews</p>
                    <p className="text-xl font-bold">{totalReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/reports?type=reviews")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">This Month</p>
                    <p className="text-xl font-bold">{thisMonthReviews}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilter("pending")}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Response Rate</p>
                    <p className="text-xl font-bold">{responseRate}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Platform Stats */}
          {platformStats.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {platformStats.map((platform) => (
                <Card key={platform.platform} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/reviews/platforms")}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center font-bold text-slate-600">
                          {platform.icon}
                        </div>
                        <div>
                          <p className="font-medium">{platform.platform}</p>
                          <p className="text-sm text-slate-500">
                            {platform.reviews} reviews
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-xl font-bold">{platform.rating}</span>
                          <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Recent Reviews</CardTitle>
                <Tabs value={filter} onValueChange={setFilter}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending
                      <Badge variant="secondary" className="ml-1">
                        {reviews.filter((r) => !r.response).length}
                      </Badge>
                    </TabsTrigger>
                    <TabsTrigger value="5">5 Star</TabsTrigger>
                    <TabsTrigger value="4">4 Star</TabsTrigger>
                    <TabsTrigger value="3">3 Star</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              {filteredReviews.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No reviews found.
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 rounded-lg border hover:border-slate-300 transition-colors cursor-pointer"
                      onClick={() => router.push(`/reviews/${review.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {getInitials(
                                review.client.firstName,
                                review.client.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{review.client.firstName} {review.client.lastName}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                              <span>via {review.source}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            {renderStars(review.rating)}
                            <Badge variant="outline">{review.source}</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            {formatDate(new Date(review.createdAt))}
                          </p>
                        </div>
                      </div>

                      <p className="text-slate-600 mb-3">{review.comment || "No comment provided."}</p>

                      {review.response && (
                        <div className="bg-slate-50 rounded-lg p-3 mb-3">
                          <p className="text-xs text-slate-500 mb-1">Your Response:</p>
                          <p className="text-sm text-slate-600">{review.response}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {!review.response && (
                          <Button size="sm" onClick={(e) => { e.stopPropagation(); router.push(`/reviews/${review.id}/respond`); }}>
                            <MessageSquare className="h-3 w-3 mr-1" />
                            Respond
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); alert("Review flagged for moderation"); }}>
                          <Flag className="h-3 w-3 mr-1" />
                          Flag
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteId(review.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-2">Delete Review</h3>
            <p className="text-slate-600 mb-4">
              Are you sure you want to delete this review? This action cannot be undone.
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
