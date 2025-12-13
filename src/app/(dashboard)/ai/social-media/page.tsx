"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Share2,
  Instagram,
  Facebook,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Shuffle,
} from "lucide-react";

const sampleData = [
  {
    platform: "instagram",
    postType: "promotion",
    topic: "20% off all hair coloring services this weekend! Book now before slots fill up.",
    tone: "exciting",
  },
  {
    platform: "facebook",
    postType: "tips",
    topic: "5 tips to keep your hair healthy during winter months",
    tone: "professional",
  },
  {
    platform: "instagram",
    postType: "behind_scenes",
    topic: "Our stylists preparing for a bridal party makeover session",
    tone: "casual",
  },
  {
    platform: "tiktok",
    postType: "transformation",
    topic: "Before and after: Blonde balayage transformation on dark hair",
    tone: "trendy",
  },
  {
    platform: "facebook",
    postType: "announcement",
    topic: "Welcoming our new nail technician Maria to the team!",
    tone: "friendly",
  },
];

export default function SocialMediaPage() {
  const router = useRouter();
  const [platform, setPlatform] = useState("");
  const [postType, setPostType] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSampleData = () => {
    const sample = sampleData[Math.floor(Math.random() * sampleData.length)];
    setPlatform(sample.platform);
    setPostType(sample.postType);
    setTopic(sample.topic);
    setTone(sample.tone);
  };

  const handleGenerate = async () => {
    if (!platform || !topic) {
      setError("Please select a platform and enter a topic");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/social-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          postType,
          topic,
          tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      // Map API response to expected format
      setResult({
        caption: data.content?.mainPost || data.content,
        hashtags: data.content?.hashtags || [],
        bestTimeToPost: data.content?.bestTimeToPost,
        imageSuggestion: data.content?.visualSuggestion,
        alternativeVersions: data.content?.alternativeVersions,
        engagementTips: data.content?.engagementTips,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Social Media Generator</h1>
            <p className="text-sm text-slate-500">AI-powered social media content</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Post Details</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Platform */}
            <div className="space-y-2">
              <Label>Platform *</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">
                    <div className="flex items-center gap-2">
                      <Instagram className="h-4 w-4" />
                      Instagram
                    </div>
                  </SelectItem>
                  <SelectItem value="facebook">
                    <div className="flex items-center gap-2">
                      <Facebook className="h-4 w-4" />
                      Facebook
                    </div>
                  </SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="twitter">Twitter/X</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Post Type */}
            <div className="space-y-2">
              <Label>Post Type</Label>
              <Select value={postType} onValueChange={setPostType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="promotion">Promotion/Sale</SelectItem>
                  <SelectItem value="tips">Tips & Advice</SelectItem>
                  <SelectItem value="behind_scenes">Behind the Scenes</SelectItem>
                  <SelectItem value="transformation">Transformation</SelectItem>
                  <SelectItem value="announcement">Announcement</SelectItem>
                  <SelectItem value="testimonial">Client Testimonial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Topic */}
            <div className="space-y-2">
              <Label>Topic/Description *</Label>
              <Textarea
                placeholder="What do you want to post about?"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
              />
            </div>

            {/* Tone */}
            <div className="space-y-2">
              <Label>Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual & Friendly</SelectItem>
                  <SelectItem value="exciting">Exciting & Energetic</SelectItem>
                  <SelectItem value="trendy">Trendy & Fun</SelectItem>
                  <SelectItem value="luxurious">Luxurious & Elegant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={loading || !platform || !topic}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Post
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
            <CardTitle className="text-lg">Generated Content</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Caption */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Caption</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(result.caption)}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-lg text-sm whitespace-pre-wrap">
                    {result.caption}
                  </div>
                </div>

                {/* Hashtags */}
                {result.hashtags && (
                  <div className="space-y-2">
                    <Label>Hashtags</Label>
                    <div className="flex flex-wrap gap-2">
                      {result.hashtags.map((tag: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Best Time to Post */}
                {result.bestTimeToPost && (
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      Best Time to Post
                    </p>
                    <p className="text-sm text-green-700">{result.bestTimeToPost}</p>
                  </div>
                )}

                {/* Image Suggestion */}
                {result.imageSuggestion && (
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium text-purple-800">
                      Image Suggestion
                    </p>
                    <p className="text-sm text-purple-700">{result.imageSuggestion}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Share2 className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Generated content will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
