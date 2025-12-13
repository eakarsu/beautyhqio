"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Star, MessageSquare, Flag, ExternalLink, Sparkles } from "lucide-react";
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
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
}

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchReview() {
      try {
        const response = await fetch(`/api/reviews/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setReview(data);
        }
      } catch (error) {
        console.error("Error fetching review:", error);
      } finally {
        setIsLoading(false);
      }
    }
    if (params.id) {
      fetchReview();
    }
  }, [params.id]);

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating
                ? "text-amber-500 fill-amber-500"
                : "text-slate-200"
            }`}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/reviews")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Loading...</h1>
        </div>
        <div className="text-center py-8 text-slate-500">Loading review...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/reviews")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Review Not Found</h1>
        </div>
        <Card>
          <CardContent className="p-8 text-center text-slate-500">
            This review could not be found or has been deleted.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/reviews")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Review Details</h1>
            <p className="text-slate-500 mt-1">
              View and manage this review
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!review.response && (
            <Button onClick={() => router.push(`/reviews/${review.id}/respond`)}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Respond
            </Button>
          )}
          <Button variant="outline">
            <Flag className="h-4 w-4 mr-2" />
            Flag
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Review Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback>
                    {getInitials(review.client.firstName, review.client.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-lg">
                    {review.client.firstName} {review.client.lastName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(review.rating)}
                    <span className="text-slate-500">({review.rating}/5)</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="mb-2">{review.source}</Badge>
                <p className="text-sm text-slate-500">
                  {formatDate(new Date(review.createdAt))}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Review Content */}
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Review</h3>
              <p className="text-slate-600 leading-relaxed">
                {review.comment || "No comment provided."}
              </p>
            </div>

            {/* Response Section */}
            {review.response ? (
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-slate-900">Your Response</h3>
                  {review.respondedAt && (
                    <span className="text-xs text-slate-500">
                      {formatDate(new Date(review.respondedAt))}
                    </span>
                  )}
                </div>
                <p className="text-slate-600">{review.response}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center">
                <MessageSquare className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                <p className="text-slate-500 mb-3">No response yet</p>
                <Button size="sm" onClick={() => router.push(`/reviews/${review.id}/respond`)}>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Write Response
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Client Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Name</p>
                <p className="font-medium">{review.client.firstName} {review.client.lastName}</p>
              </div>
              {review.client.email && (
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{review.client.email}</p>
                </div>
              )}
              {review.client.phone && (
                <div>
                  <p className="text-sm text-slate-500">Phone</p>
                  <p className="font-medium">{review.client.phone}</p>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={() => router.push(`/clients/${review.client.id}`)}
              >
                View Client Profile
              </Button>
            </CardContent>
          </Card>

          {/* Review Info Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Review Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-slate-500">Platform</p>
                <Badge variant="outline">{review.source}</Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Rating</p>
                <div className="flex items-center gap-2">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-500">Visibility</p>
                <Badge variant={review.isPublic ? "success" : "secondary"}>
                  {review.isPublic ? "Public" : "Private"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant={review.response ? "success" : "destructive"}>
                  {review.response ? "Responded" : "Pending Response"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
