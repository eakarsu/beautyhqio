"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, Send, Sparkles } from "lucide-react";

interface Review {
  id: string;
  clientName: string;
  rating: number;
  content: string;
  platform: string;
  createdAt: string;
  response?: string;
}

export default function RespondToReviewPage() {
  const router = useRouter();
  const params = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Simulate fetching review data
    setTimeout(() => {
      setReview({
        id: params.id as string,
        clientName: "Sarah M.",
        rating: 5,
        content:
          "Amazing service! My stylist really understood what I wanted and the results exceeded my expectations. The salon atmosphere is so relaxing and the staff is incredibly friendly. Will definitely be coming back!",
        platform: "Google",
        createdAt: new Date().toISOString(),
      });
      setIsLoading(false);
    }, 500);
  }, [params.id]);

  const handleGenerateResponse = async () => {
    setIsGenerating(true);
    // Simulate AI generating a response
    setTimeout(() => {
      setResponse(
        `Thank you so much for your wonderful review, ${review?.clientName?.split(" ")[0]}! We're thrilled to hear that you had such a great experience with us. Our team takes pride in understanding exactly what our clients want, and we're so happy we could exceed your expectations. We look forward to seeing you again soon!`
      );
      setIsGenerating(false);
    }, 1500);
  };

  const handleSendResponse = async () => {
    if (!response.trim()) return;
    setIsSending(true);

    // Simulate sending response
    setTimeout(() => {
      alert("Response sent successfully!");
      router.push("/reviews");
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading review...</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/reviews")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Review Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/reviews")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Respond to Review</h1>
          <p className="text-muted-foreground">
            Write a response to {review.clientName}'s review
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center font-medium">
                {review.clientName[0]}
              </div>
              <div>
                <p className="font-medium">{review.clientName}</p>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-slate-300"
                        }`}
                      />
                    ))}
                  </div>
                  <Badge variant="outline">{review.platform}</Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-slate-700">{review.content}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Response</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateResponse}
              disabled={isGenerating}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isGenerating ? "Generating..." : "AI Suggest"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Response Message</Label>
            <Textarea
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Write your response to this review..."
              rows={6}
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => router.push("/reviews")}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendResponse}
              disabled={isSending || !response.trim()}
              className="flex-1"
            >
              <Send className="h-4 w-4 mr-2" />
              {isSending ? "Sending..." : "Send Response"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
