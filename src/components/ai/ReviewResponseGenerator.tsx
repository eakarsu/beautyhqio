"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  Sparkles,
  Copy,
  RefreshCw,
  Check,
  ThumbsUp,
  ThumbsDown,
  Wand2,
} from "lucide-react";

interface Review {
  rating: number;
  text: string;
  clientName?: string;
  date?: string;
  platform?: string;
  staffMentioned?: string;
}

interface ReviewResponseGeneratorProps {
  review?: Review;
  onGenerate?: (response: string) => void;
}

const RESPONSE_TONES = [
  { value: "professional", label: "Professional" },
  { value: "warm", label: "Warm & Grateful" },
  { value: "apologetic", label: "Apologetic" },
  { value: "solution_focused", label: "Solution-Focused" },
];

export function ReviewResponseGenerator({ review, onGenerate }: ReviewResponseGeneratorProps) {
  const [reviewText, setReviewText] = useState(review?.text || "");
  const [rating, setRating] = useState(review?.rating || 5);
  const [tone, setTone] = useState("warm");
  const [generatedResponse, setGeneratedResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!reviewText.trim()) return;

    setIsGenerating(true);
    try {
      const response = await fetch("/api/ai/reviews/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewText,
          rating,
          tone,
          clientName: review?.clientName,
          staffMentioned: review?.staffMentioned,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedResponse(data.response);
        onGenerate?.(data.response);
      }
    } catch (error) {
      console.error("Error generating response:", error);
      // Demo generated responses
      const positiveResponse = `Thank you so much for your wonderful ${rating}-star review${review?.clientName ? `, ${review.clientName}` : ""}! We're thrilled to hear about your positive experience${review?.staffMentioned ? ` with ${review.staffMentioned}` : ""}. Making our clients happy is what we love most! We look forward to seeing you again soon. ✨`;

      const negativeResponse = `Thank you for taking the time to share your feedback${review?.clientName ? `, ${review.clientName}` : ""}. We're truly sorry to hear that your experience didn't meet expectations. This is not the standard we strive for, and we'd like the opportunity to make things right. Please reach out to us directly so we can address your concerns personally. Your satisfaction matters greatly to us.`;

      const neutralResponse = `Thank you for your review and feedback${review?.clientName ? `, ${review.clientName}` : ""}. We appreciate you sharing your experience with us. We're always looking for ways to improve and would love to hear more about how we can better serve you. Please feel free to reach out directly with any additional feedback. We hope to see you again soon!`;

      if (rating >= 4) {
        setGeneratedResponse(positiveResponse);
      } else if (rating <= 2) {
        setGeneratedResponse(negativeResponse);
      } else {
        setGeneratedResponse(neutralResponse);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderStars = () => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            className="focus:outline-none"
          >
            <Star
              className={`h-6 w-6 ${
                star <= rating
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const getSentiment = () => {
    if (rating >= 4) return { label: "Positive", icon: ThumbsUp, color: "text-green-600" };
    if (rating <= 2) return { label: "Negative", icon: ThumbsDown, color: "text-red-600" };
    return { label: "Neutral", icon: Star, color: "text-yellow-600" };
  };

  const sentiment = getSentiment();
  const SentimentIcon = sentiment.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Review Response Generator
        </CardTitle>
        <CardDescription>
          Generate professional responses to customer reviews using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Review Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Customer Review</Label>
            <div className="flex items-center gap-2">
              <SentimentIcon className={`h-4 w-4 ${sentiment.color}`} />
              <Badge variant="secondary">{sentiment.label}</Badge>
            </div>
          </div>
          <Textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Paste the customer review here..."
            rows={4}
          />
        </div>

        {/* Rating Selection */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label>Rating</Label>
            {renderStars()}
          </div>

          <div className="space-y-1">
            <Label>Response Tone</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESPONSE_TONES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tips based on rating */}
        <div className={`p-3 rounded-lg ${
          rating >= 4 ? "bg-green-50" : rating <= 2 ? "bg-red-50" : "bg-yellow-50"
        }`}>
          <p className={`text-sm ${
            rating >= 4 ? "text-green-800" : rating <= 2 ? "text-red-800" : "text-yellow-800"
          }`}>
            {rating >= 4 && "💡 Tip: Thank the customer warmly and mention specific positives they noted."}
            {rating <= 2 && "💡 Tip: Acknowledge concerns, apologize sincerely, and offer to resolve issues offline."}
            {rating === 3 && "💡 Tip: Thank them for feedback and ask how you can improve their experience."}
          </p>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !reviewText.trim()}
          className="w-full bg-rose-600 hover:bg-rose-700"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Response...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Response
            </>
          )}
        </Button>

        {/* Generated Response */}
        {generatedResponse && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label>Generated Response</Label>
              <Badge variant="secondary">
                {generatedResponse.length} characters
              </Badge>
            </div>
            <Textarea
              value={generatedResponse}
              onChange={(e) => setGeneratedResponse(e.target.value)}
              rows={6}
              className="font-mono"
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy Response"}
              </Button>
              <Button variant="outline" onClick={handleGenerate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {/* Best Practices */}
        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2 text-sm">Response Best Practices:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Respond within 24-48 hours</li>
            <li>• Personalize with client's name if available</li>
            <li>• Keep responses concise but meaningful</li>
            <li>• For negative reviews, take the conversation offline</li>
            <li>• Thank all reviewers for their feedback</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
