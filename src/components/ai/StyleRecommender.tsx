"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Camera,
  Upload,
  Sparkles,
  Star,
  Scissors,
  Palette,
  Wand2,
  Heart,
  Share2,
  Download,
  RefreshCw,
} from "lucide-react";

interface StyleRecommendation {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  confidence: number;
  category: "cut" | "color" | "treatment";
  matchReasons: string[];
  relatedServices: string[];
  estimatedPrice: number;
}

interface StyleRecommenderProps {
  clientId?: string;
  onServiceSelect?: (serviceNames: string[]) => void;
}

export function StyleRecommender({ clientId, onServiceSelect }: StyleRecommenderProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<"all" | "cut" | "color" | "treatment">("all");
  const [savedStyles, setSavedStyles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        analyzeImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/style/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageData, clientId }),
      });
      if (response.ok) {
        const data = await response.json();
        setRecommendations(data);
      }
    } catch (error) {
      console.error("Error analyzing image:", error);
      // Demo data
      setRecommendations([
        {
          id: "r1",
          name: "Layered Bob",
          description: "A modern layered bob that frames the face beautifully, adding volume and movement.",
          confidence: 95,
          category: "cut",
          matchReasons: ["Complements face shape", "Low maintenance", "Trending style"],
          relatedServices: ["Haircut", "Blowout"],
          estimatedPrice: 65,
        },
        {
          id: "r2",
          name: "Balayage Highlights",
          description: "Natural-looking sun-kissed highlights that grow out beautifully.",
          confidence: 88,
          category: "color",
          matchReasons: ["Enhances natural tones", "Low maintenance color", "Face-framing dimension"],
          relatedServices: ["Balayage", "Toner", "Deep Conditioning"],
          estimatedPrice: 250,
        },
        {
          id: "r3",
          name: "Curtain Bangs",
          description: "Soft, face-framing bangs that part in the middle for a retro-modern look.",
          confidence: 82,
          category: "cut",
          matchReasons: ["Softens features", "Versatile styling", "Currently trending"],
          relatedServices: ["Haircut", "Bang Trim"],
          estimatedPrice: 15,
        },
        {
          id: "r4",
          name: "Glossy Treatment",
          description: "A professional gloss treatment to enhance shine and color vibrancy.",
          confidence: 78,
          category: "treatment",
          matchReasons: ["Boosts shine", "Reduces frizz", "Color protection"],
          relatedServices: ["Gloss Treatment"],
          estimatedPrice: 45,
        },
        {
          id: "r5",
          name: "Copper Tones",
          description: "Warm copper undertones to add warmth and dimension to your color.",
          confidence: 75,
          category: "color",
          matchReasons: ["Complements skin tone", "Trending color", "Adds warmth"],
          relatedServices: ["Single Process Color", "Toner"],
          estimatedPrice: 120,
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSaveStyle = (styleId: string) => {
    setSavedStyles((prev) =>
      prev.includes(styleId)
        ? prev.filter((id) => id !== styleId)
        : [...prev, styleId]
    );
  };

  const getCategoryIcon = (category: StyleRecommendation["category"]) => {
    switch (category) {
      case "cut":
        return <Scissors className="h-4 w-4" />;
      case "color":
        return <Palette className="h-4 w-4" />;
      case "treatment":
        return <Wand2 className="h-4 w-4" />;
    }
  };

  const filteredRecommendations = recommendations.filter(
    (r) => selectedCategory === "all" || r.category === selectedCategory
  );

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Style Recommender
          </CardTitle>
          <CardDescription>
            Upload a photo to get personalized style recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          {!uploadedImage ? (
            <div
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:border-rose-300 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Camera className="h-10 w-10 text-rose-600" />
              </div>
              <h3 className="text-lg font-medium mb-2">Upload a Photo</h3>
              <p className="text-muted-foreground mb-4">
                Take a selfie or upload an existing photo
              </p>
              <div className="flex justify-center gap-3">
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-6">
              <div className="relative">
                <img
                  src={uploadedImage}
                  alt="Uploaded"
                  className="w-48 h-48 object-cover rounded-lg"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute bottom-2 right-2"
                  onClick={() => {
                    setUploadedImage(null);
                    setRecommendations([]);
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  New Photo
                </Button>
              </div>
              <div className="flex-1">
                {isAnalyzing ? (
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600" />
                    <div>
                      <p className="font-medium">Analyzing your photo...</p>
                      <p className="text-sm text-muted-foreground">
                        Our AI is finding the perfect styles for you
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="font-medium mb-2">
                      Found {recommendations.length} recommendations
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Based on your face shape, features, and current trends
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Style Recommendations</CardTitle>
              <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as typeof selectedCategory)}>
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="cut">Cuts</TabsTrigger>
                  <TabsTrigger value="color">Color</TabsTrigger>
                  <TabsTrigger value="treatment">Treatment</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {filteredRecommendations.map((rec) => (
                  <Card key={rec.id}>
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {rec.imageUrl && (
                          <img
                            src={rec.imageUrl}
                            alt={rec.name}
                            className="w-32 h-32 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-lg">{rec.name}</h4>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  {getCategoryIcon(rec.category)}
                                  {rec.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 text-rose-600">
                              <Star className="h-4 w-4 fill-current" />
                              <span className="font-medium">{rec.confidence}%</span>
                            </div>
                          </div>

                          <div className="mb-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Why this works for you:
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {rec.matchReasons.map((reason, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {reason}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Starting at </span>
                              <span className="font-semibold">${rec.estimatedPrice}</span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSaveStyle(rec.id)}
                              >
                                <Heart
                                  className={`h-4 w-4 ${
                                    savedStyles.includes(rec.id)
                                      ? "fill-red-500 text-red-500"
                                      : ""
                                  }`}
                                />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onServiceSelect?.(rec.relatedServices)}
                              >
                                Book This Look
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
