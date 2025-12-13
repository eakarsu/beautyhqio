"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Upload,
  Camera,
  Sparkles,
  User,
  Scissors,
  Palette,
  Star,
  Heart,
  Save,
  Share2,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface StyleRecommendation {
  id: string;
  name: string;
  description: string;
  image: string;
  confidence: number;
  tags: string[];
  colorSuggestions?: string[];
}

export default function StyleRecommenderPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [faceShape, setFaceShape] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<StyleRecommendation[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [savedStyles, setSavedStyles] = useState<Set<string>>(new Set());
  const [preferences, setPreferences] = useState({
    hairLength: "",
    hairType: "",
    lifestyle: "",
    maintenance: "",
    notes: "",
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
        setRecommendations([]);
        setFaceShape(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzePhoto = async () => {
    if (!uploadedImage) return;

    setIsAnalyzing(true);
    try {
      const response = await fetch("/api/ai/style-recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: uploadedImage,
          preferences,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setFaceShape(data.faceShape);
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error("Error analyzing photo:", error);
      // Demo data
      setFaceShape("Oval");
      setRecommendations([
        {
          id: "1",
          name: "Layered Lob",
          description: "A shoulder-length cut with soft layers that frame the face beautifully. Perfect for oval face shapes.",
          image: "/styles/layered-lob.jpg",
          confidence: 0.92,
          tags: ["Medium Length", "Layered", "Low Maintenance"],
          colorSuggestions: ["Honey Blonde", "Caramel Highlights", "Rich Brunette"],
        },
        {
          id: "2",
          name: "Soft Waves",
          description: "Romantic, flowing waves that add movement and dimension. Works well with your natural texture.",
          image: "/styles/soft-waves.jpg",
          confidence: 0.88,
          tags: ["Long", "Wavy", "Feminine"],
          colorSuggestions: ["Balayage", "Sun-kissed Highlights"],
        },
        {
          id: "3",
          name: "Textured Bob",
          description: "A modern, edgy bob with textured ends for a chic, contemporary look.",
          image: "/styles/textured-bob.jpg",
          confidence: 0.85,
          tags: ["Short", "Modern", "Bold"],
          colorSuggestions: ["Platinum", "Ash Blonde", "Deep Burgundy"],
        },
      ]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/ai")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">AI Style Recommender</h1>
            <p className="text-muted-foreground">
              Get personalized hairstyle recommendations based on face shape analysis
            </p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Photo</CardTitle>
            <CardDescription>Upload a clear front-facing photo</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-rose-500 transition-colors ${
                uploadedImage ? "border-rose-500" : "border-muted"
              }`}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadedImage ? (
                <div className="space-y-4">
                  <img
                    src={uploadedImage}
                    alt="Uploaded"
                    className="w-full max-w-[200px] mx-auto rounded-lg"
                  />
                  <p className="text-sm text-muted-foreground">Click to change photo</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Upload a photo</p>
                    <p className="text-sm text-muted-foreground">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            {faceShape && (
              <div className="mt-4 p-4 bg-rose-50 rounded-lg">
                <div className="flex items-center gap-2 text-rose-700">
                  <User className="h-5 w-5" />
                  <span className="font-medium">Face Shape Detected:</span>
                  <Badge>{faceShape}</Badge>
                </div>
              </div>
            )}

            <Button
              className="w-full mt-4 bg-rose-600 hover:bg-rose-700"
              disabled={!uploadedImage || isAnalyzing}
              onClick={analyzePhoto}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Style Preferences</CardTitle>
            <CardDescription>Help us find your perfect style</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Length</Label>
              <Select
                value={preferences.hairLength}
                onValueChange={(v) => setPreferences({ ...preferences, hairLength: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select length" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Short</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="long">Long</SelectItem>
                  <SelectItem value="any">Open to anything</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Hair Type</Label>
              <Select
                value={preferences.hairType}
                onValueChange={(v) => setPreferences({ ...preferences, hairType: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="straight">Straight</SelectItem>
                  <SelectItem value="wavy">Wavy</SelectItem>
                  <SelectItem value="curly">Curly</SelectItem>
                  <SelectItem value="coily">Coily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Lifestyle</Label>
              <Select
                value={preferences.lifestyle}
                onValueChange={(v) => setPreferences({ ...preferences, lifestyle: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select lifestyle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional/Corporate</SelectItem>
                  <SelectItem value="active">Active/Athletic</SelectItem>
                  <SelectItem value="creative">Creative/Artistic</SelectItem>
                  <SelectItem value="casual">Casual/Relaxed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Maintenance Level</Label>
              <Select
                value={preferences.maintenance}
                onValueChange={(v) => setPreferences({ ...preferences, maintenance: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select maintenance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low - Wash and go</SelectItem>
                  <SelectItem value="medium">Medium - Some styling</SelectItem>
                  <SelectItem value="high">High - Daily styling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Additional Notes</Label>
              <Textarea
                value={preferences.notes}
                onChange={(e) => setPreferences({ ...preferences, notes: e.target.value })}
                placeholder="Any specific requests or concerns..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="md:row-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Style Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions based on your features</CardDescription>
          </CardHeader>
          <CardContent>
            {recommendations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Scissors className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload a photo to get personalized recommendations</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recommendations.map((rec, index) => (
                  <div key={rec.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold">{rec.name}</span>
                          {index === 0 && (
                            <Badge className="bg-rose-100 text-rose-700">
                              <Star className="h-3 w-3 mr-1" />
                              Top Match
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(rec.confidence * 100)}% match
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setFavorites(prev => {
                            const newFavorites = new Set(prev);
                            if (newFavorites.has(rec.id)) {
                              newFavorites.delete(rec.id);
                            } else {
                              newFavorites.add(rec.id);
                            }
                            return newFavorites;
                          });
                        }}
                      >
                        <Heart className={`h-4 w-4 ${favorites.has(rec.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">{rec.description}</p>

                    <div className="flex flex-wrap gap-1 mb-3">
                      {rec.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {rec.colorSuggestions && (
                      <div className="mb-3">
                        <div className="flex items-center gap-1 text-sm font-medium mb-1">
                          <Palette className="h-3 w-3" />
                          Color Suggestions:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {rec.colorSuggestions.map((color) => (
                            <Badge key={color} variant="outline" className="text-xs">
                              {color}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSavedStyles(prev => {
                            const newSaved = new Set(prev);
                            if (newSaved.has(rec.id)) {
                              newSaved.delete(rec.id);
                              alert(`"${rec.name}" removed from saved styles`);
                            } else {
                              newSaved.add(rec.id);
                              alert(`"${rec.name}" saved to your collection!`);
                            }
                            return newSaved;
                          });
                        }}
                        className={savedStyles.has(rec.id) ? 'bg-green-50 border-green-500 text-green-700' : ''}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {savedStyles.has(rec.id) ? 'Saved' : 'Save'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const shareText = `Check out this hairstyle: ${rec.name} - ${rec.description}`;
                          if (navigator.share) {
                            navigator.share({ title: rec.name, text: shareText });
                          } else {
                            navigator.clipboard.writeText(shareText);
                            alert('Style copied to clipboard!');
                          }
                        }}
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        Share
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
