"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Minus,
  AlertTriangle,
  Shuffle,
  Star,
  TrendingUp,
} from "lucide-react";

const sampleReviews = [
  {
    review: "Amazing experience! Sarah did an incredible job with my balayage. The salon is beautiful and everyone is so friendly. Will definitely be back!",
    source: "google",
  },
  {
    review: "Waited 30 minutes past my appointment time. The haircut was okay but not worth the wait. Staff seemed rushed.",
    source: "yelp",
  },
  {
    review: "Good service, fair prices. My nails look nice. Nothing special but gets the job done.",
    source: "facebook",
  },
  {
    review: "Terrible! They completely ruined my hair color. It's nothing like what I asked for. Manager was rude when I complained. Never coming back!",
    source: "google",
  },
  {
    review: "Love this place! Been coming for 2 years now. Ashley always knows exactly what I want. The only downside is parking can be difficult.",
    source: "yelp",
  },
];

export default function SentimentPage() {
  const router = useRouter();
  const [review, setReview] = useState("");
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const loadSampleData = () => {
    const sample = sampleReviews[Math.floor(Math.random() * sampleReviews.length)];
    setReview(sample.review);
    setSource(sample.source);
  };

  const handleAnalyze = async () => {
    if (!review) {
      setError("Please enter a review to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/sentiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText: review,
          source: source || null,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze");
      }
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (type: string) => {
    switch (type) {
      case "positive": return "bg-green-500";
      case "negative": return "bg-red-500";
      default: return "bg-amber-500";
    }
  };

  const getSentimentIcon = (type: string) => {
    switch (type) {
      case "positive": return <ThumbsUp className="h-5 w-5" />;
      case "negative": return <ThumbsDown className="h-5 w-5" />;
      default: return <Minus className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Sentiment Analysis</h1>
            <p className="text-sm text-slate-500">AI-powered review insights</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Review Analysis</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Review Text */}
            <div className="space-y-2">
              <Label>Review Text *</Label>
              <Textarea
                placeholder="Paste a customer review here..."
                value={review}
                onChange={(e) => setReview(e.target.value)}
                rows={6}
              />
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label>Source</Label>
              <div className="flex gap-2">
                {["google", "yelp", "facebook", "website"].map((s) => (
                  <Button
                    key={s}
                    variant={source === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSource(s)}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleAnalyze}
              disabled={loading || !review}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Sentiment
                </>
              )}
            </Button>

            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Sentiment Score */}
                {result.sentiment && (
                  <div className={`p-4 rounded-lg ${
                    result.sentiment.type === "positive" ? "bg-green-50 border-green-200" :
                    result.sentiment.type === "negative" ? "bg-red-50 border-red-200" :
                    "bg-amber-50 border-amber-200"
                  } border`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${getSentimentColor(result.sentiment.type)} text-white`}>
                          {getSentimentIcon(result.sentiment.type)}
                        </div>
                        <div>
                          <p className="font-semibold capitalize">{result.sentiment.type} Sentiment</p>
                          <p className="text-sm text-slate-600">
                            Confidence: {Math.round(result.sentiment.score)}%
                          </p>
                        </div>
                      </div>
                      {result.sentiment.type === "negative" && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Needs Attention
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Key Themes */}
                {result.keyThemes && result.keyThemes.length > 0 && (
                  <div className="space-y-2">
                    <Label>Key Themes Detected</Label>
                    <div className="flex flex-wrap gap-2">
                      {result.keyThemes.map((theme: string, i: number) => (
                        <Badge key={i} variant="outline">
                          {theme}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Suggested Response */}
                {result.suggestedResponse && (
                  <div className="space-y-2">
                    <Label>Suggested Response</Label>
                    <div className="p-4 bg-slate-50 rounded-lg text-sm">
                      {result.suggestedResponse}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {result.actionItems && result.actionItems.length > 0 && (
                  <div className="space-y-2">
                    <Label>Recommended Actions</Label>
                    <ul className="space-y-2">
                      {result.actionItems.map((action: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <TrendingUp className="h-4 w-4 text-blue-500 mt-0.5" />
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Priority */}
                {result.priority && (
                  <div className={`p-3 rounded-lg ${
                    result.priority === "high" ? "bg-red-50" :
                    result.priority === "medium" ? "bg-amber-50" :
                    "bg-green-50"
                  }`}>
                    <p className="text-sm font-medium">
                      Response Priority: <span className="capitalize">{result.priority}</span>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Sentiment analysis will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
