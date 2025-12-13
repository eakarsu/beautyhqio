"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  TrendingUp,
  Sparkles,
  Loader2,
  DollarSign,
  ShoppingBag,
  Shuffle,
  Star,
} from "lucide-react";

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

const sampleData = [
  {
    clientName: "Sarah Johnson",
    currentService: "Hair Color",
    clientHistory: "Regular client, gets color every 6 weeks, has dry hair",
  },
  {
    clientName: "Emily Davis",
    currentService: "Haircut",
    clientHistory: "First-time client, mentioned wanting to try something new",
  },
  {
    clientName: "Jessica Williams",
    currentService: "Manicure",
    clientHistory: "Loyal client, always gets basic manicure, never tried gel",
  },
  {
    clientName: "Amanda Brown",
    currentService: "Facial",
    clientHistory: "VIP client, interested in anti-aging treatments",
  },
  {
    clientName: "Rachel Lee",
    currentService: "Balayage",
    clientHistory: "New client referred by friend, first balayage ever",
  },
];

export default function UpsellPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [currentService, setCurrentService] = useState("");
  const [clientHistory, setClientHistory] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients?limit=50");
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  const loadSampleData = () => {
    const sample = sampleData[Math.floor(Math.random() * sampleData.length)];
    setClientName(sample.clientName);
    setCurrentService(sample.currentService);
    setClientHistory(sample.clientHistory);
    setSelectedClientId("");
  };

  const handleGenerate = async () => {
    if (!currentService) {
      setError("Please select a current service");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/ai/upsell-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClientId || undefined,
          currentServices: [{ name: currentService, price: 0 }],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate");
      }

      // Map API response to UI expected format
      setResult({
        primaryUpsell: data.suggestions?.addOnServices?.[0] ? {
          service: data.suggestions.addOnServices[0].name,
          reason: data.suggestions.addOnServices[0].reason,
          additionalRevenue: data.suggestions.addOnServices[0].price || 0,
          confidence: 85,
        } : null,
        additionalSuggestions: data.suggestions?.addOnServices?.slice(1).map((s: any) => ({
          service: s.name,
          reason: s.reason,
          additionalRevenue: s.price || 0,
        })) || [],
        productSuggestions: data.suggestions?.products?.map((p: any) => ({
          name: p.name,
          reason: p.reason,
          price: p.price || 0,
        })) || [],
        suggestedScript: data.suggestions?.personalizedMessage,
        potentialRevenue: data.potentialRevenue?.total || 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
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
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Upsell Suggestions</h1>
            <p className="text-sm text-slate-500">AI-powered service recommendations</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Client & Service</CardTitle>
            <Button variant="outline" size="sm" onClick={loadSampleData}>
              <Shuffle className="h-4 w-4 mr-2" />
              Load Sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <Label>Client</Label>
              <Select
                value={selectedClientId}
                onValueChange={(value) => {
                  setSelectedClientId(value);
                  const client = clients.find((c) => c.id === value);
                  if (client) {
                    setClientName(`${client.firstName} ${client.lastName}`);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={clientName || "Select client or use sample"} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Current Service */}
            <div className="space-y-2">
              <Label>Current Service *</Label>
              <Select value={currentService} onValueChange={setCurrentService}>
                <SelectTrigger>
                  <SelectValue placeholder="Select service being booked" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Haircut">Haircut</SelectItem>
                  <SelectItem value="Hair Color">Hair Color</SelectItem>
                  <SelectItem value="Balayage">Balayage</SelectItem>
                  <SelectItem value="Highlights">Highlights</SelectItem>
                  <SelectItem value="Blowout">Blowout</SelectItem>
                  <SelectItem value="Manicure">Manicure</SelectItem>
                  <SelectItem value="Pedicure">Pedicure</SelectItem>
                  <SelectItem value="Gel Nails">Gel Nails</SelectItem>
                  <SelectItem value="Facial">Facial</SelectItem>
                  <SelectItem value="Massage">Massage</SelectItem>
                  <SelectItem value="Waxing">Waxing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Client History */}
            <div className="space-y-2">
              <Label>Client Notes/History</Label>
              <textarea
                className="w-full p-3 border rounded-lg text-sm"
                placeholder="Any notes about client preferences, past services, or concerns..."
                value={clientHistory}
                onChange={(e) => setClientHistory(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              className="w-full"
              onClick={handleGenerate}
              disabled={loading || !currentService}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Suggestions...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Get Upsell Suggestions
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
            <CardTitle className="text-lg">AI Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            {result ? (
              <div className="space-y-4">
                {/* Primary Upsell */}
                {result.primaryUpsell && (
                  <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-800">Top Recommendation</span>
                    </div>
                    <p className="font-medium text-lg">{result.primaryUpsell.service}</p>
                    <p className="text-sm text-slate-600 mt-1">{result.primaryUpsell.reason}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-600">
                        <DollarSign className="h-3 w-3 mr-1" />
                        +${result.primaryUpsell.additionalRevenue}
                      </Badge>
                      <Badge variant="outline">{result.primaryUpsell.confidence}% match</Badge>
                    </div>
                  </div>
                )}

                {/* Additional Suggestions */}
                {result.additionalSuggestions && result.additionalSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <Label>Additional Options</Label>
                    {result.additionalSuggestions.map((suggestion: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-slate-50 border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{suggestion.service}</span>
                          <Badge variant="outline">
                            +${suggestion.additionalRevenue}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{suggestion.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Products */}
                {result.productSuggestions && result.productSuggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4 text-purple-600" />
                      <Label>Retail Products</Label>
                    </div>
                    {result.productSuggestions.map((product: any, i: number) => (
                      <div key={i} className="p-3 rounded-lg bg-purple-50 border border-purple-100">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{product.name}</span>
                          <Badge className="bg-purple-600">${product.price}</Badge>
                        </div>
                        <p className="text-sm text-slate-600 mt-1">{product.reason}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Script */}
                {result.suggestedScript && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <Label className="text-blue-800">Suggested Script</Label>
                    <p className="text-sm text-blue-700 mt-2 italic">
                      "{result.suggestedScript}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Upsell suggestions will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
