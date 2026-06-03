"use client";

import { useState, useEffect } from "react";
import { ShoppingBag, ArrowLeft, Loader2, Plus, Trash2, Sparkles, Clock, DollarSign } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface Recommendations {
  clientProfile: { summary: string; primaryFocus: string };
  skincare: { essentials: any[]; treatments: any[] };
  haircare: { essentials: any[]; treatments: any[] };
  routines: { morning: any; evening: any; weekly: any };
  ingredientsToAvoid: { ingredient: string; reason: string }[];
  ingredientsToSeek: { ingredient: string; benefit: string }[];
  budgetOptions: { drugstore: any[]; midRange: any[]; luxury: any[] };
  professionalTreatments: { treatment: string; benefit: string; frequency: string }[];
  expectedResults: { week1: string; month1: string; month3: string };
  tips: { category: string; tip: string }[];
}

interface ProductRecord {
  id: string;
  skinType: string;
  hairType: string;
  concerns: string[];
  createdAt: string;
}

const skinTypes = ["oily", "dry", "combination", "normal", "sensitive"];
const hairTypes = ["straight", "wavy", "curly", "coily", "fine", "thick", "colored", "damaged"];
const concerns = [
  "Acne", "Aging", "Dark spots", "Dryness", "Frizz", "Hair loss",
  "Hyperpigmentation", "Large pores", "Oiliness", "Redness",
  "Sensitivity", "Split ends", "Dandruff", "Dullness", "Fine lines"
];
const allergies = [
  "Fragrance", "Sulfates", "Parabens", "Alcohol", "Silicones",
  "Essential oils", "Lanolin", "Coconut derivatives"
];

export default function ProductRecommenderPage() {
  const [records, setRecords] = useState<ProductRecord[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendations | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Form state
  const [skinType, setSkinType] = useState("");
  const [hairType, setHairType] = useState("");
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);
  const [budget, setBudget] = useState("mid-range");

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/ai/product-recommender?limit=15");
      const data = await res.json();
      if (data.success) setRecords(data.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConcerns.length === 0) return;

    setLoading(true);
    try {
      const res = await fetch("/api/ai/product-recommender", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skinType, hairType, concerns: selectedConcerns,
          allergies: selectedAllergies, budget,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRecommendations(data.recommendations);
        fetchRecords();
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/ai/product-recommender?id=${id}`, { method: "DELETE" });
      setRecords(records.filter((r) => r.id !== id));
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const toggleSelection = (item: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const loadSampleData = () => {
    setSkinType("combination");
    setHairType("wavy");
    setSelectedConcerns(["Acne", "Dryness", "Frizz", "Dark spots"]);
    setSelectedAllergies(["Fragrance", "Sulfates"]);
    setBudget("mid-range");
    setShowForm(true);
    setRecommendations(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/ai" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div className="p-3 bg-orange-500 rounded-xl">
                <ShoppingBag className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI Product Recommender</h1>
                <p className="text-sm text-gray-500">Personalized product recommendations</p>
              </div>
            </div>
            <button
              onClick={() => { setShowForm(true); setRecommendations(null); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus className="h-5 w-5" />
              Get Recommendations
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showForm && !recommendations ? (
          /* Form */
          <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tell us about yourself</h2>
                <button type="button" onClick={loadSampleData} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 border border-gray-300">Load Sample Data</button>
              </div>

              {/* Skin Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Skin Type</label>
                <div className="flex flex-wrap gap-2">
                  {skinTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSkinType(type)}
                      className={`px-4 py-2 rounded-lg capitalize border transition-colors ${
                        skinType === type
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white border-gray-300 hover:border-orange-500"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hair Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Hair Type</label>
                <div className="flex flex-wrap gap-2">
                  {hairTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHairType(type)}
                      className={`px-4 py-2 rounded-lg capitalize border transition-colors ${
                        hairType === type
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white border-gray-300 hover:border-orange-500"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Concerns */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Concerns (select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {concerns.map((concern) => (
                    <button
                      key={concern}
                      type="button"
                      onClick={() => toggleSelection(concern, selectedConcerns, setSelectedConcerns)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedConcerns.includes(concern)
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white border-gray-300 hover:border-orange-500"
                      }`}
                    >
                      {concern}
                    </button>
                  ))}
                </div>
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allergies/Sensitivities (optional)
                </label>
                <div className="flex flex-wrap gap-2">
                  {allergies.map((allergy) => (
                    <button
                      key={allergy}
                      type="button"
                      onClick={() => toggleSelection(allergy, selectedAllergies, setSelectedAllergies)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                        selectedAllergies.includes(allergy)
                          ? "bg-red-500 text-white border-red-500"
                          : "bg-white border-gray-300 hover:border-red-500"
                      }`}
                    >
                      {allergy}
                    </button>
                  ))}
                </div>
              </div>

              {/* Budget */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Budget</label>
                <div className="grid grid-cols-3 gap-3">
                  {["budget", "mid-range", "luxury"].map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => setBudget(b)}
                      className={`py-3 px-4 rounded-lg capitalize border transition-colors ${
                        budget === b
                          ? "bg-orange-500 text-white border-orange-500"
                          : "bg-white border-gray-300 hover:border-orange-500"
                      }`}
                    >
                      <DollarSign className={`h-4 w-4 mx-auto mb-1 ${budget === b ? "text-white" : "text-gray-400"}`} />
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || selectedConcerns.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                  {loading ? "Analyzing..." : "Get Recommendations"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : recommendations ? (
          /* Results */
          <div className="space-y-8">
            {/* Profile Summary */}
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-2xl p-6 text-white">
              <h2 className="text-xl font-semibold mb-2">Your Profile</h2>
              <p className="text-white/90">{recommendations.clientProfile.summary}</p>
              <p className="text-sm text-white/70 mt-2">Primary Focus: {recommendations.clientProfile.primaryFocus}</p>
            </div>

            {/* Skincare Products */}
            {recommendations.skincare.essentials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-pink-500" />
                  Skincare Essentials
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.skincare.essentials.map((product: any, idx: number) => (
                    <div key={idx} className="p-4 bg-pink-50 dark:bg-pink-900/20 rounded-xl">
                      <div className="font-medium text-pink-800 dark:text-pink-200">{product.step}</div>
                      <div className="text-sm text-pink-600 dark:text-pink-400">{product.productType}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{product.benefit}</p>
                      {product.keyIngredients && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {product.keyIngredients.map((ing: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-white/50 rounded text-xs">{ing}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Haircare Products */}
            {recommendations.haircare.essentials.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Haircare Essentials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendations.haircare.essentials.map((product: any, idx: number) => (
                    <div key={idx} className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <div className="font-medium text-purple-800 dark:text-purple-200">{product.step}</div>
                      <div className="text-sm text-purple-600 dark:text-purple-400">{product.productType}</div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{product.benefit}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Routines */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { title: "Morning", data: recommendations.routines.morning, color: "bg-yellow-500" },
                { title: "Evening", data: recommendations.routines.evening, color: "bg-indigo-500" },
                { title: "Weekly", data: recommendations.routines.weekly, color: "bg-green-500" },
              ].map((routine) => (
                <div key={routine.title} className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className={`w-10 h-10 ${routine.color} rounded-lg flex items-center justify-center mb-4`}>
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{routine.title} Routine</h3>
                  {routine.data?.steps && (
                    <ol className="space-y-2">
                      {routine.data.steps.map((step: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex-shrink-0 w-5 h-5 bg-gray-100 rounded-full flex items-center justify-center text-xs">
                            {idx + 1}
                          </span>
                          {step}
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              ))}
            </div>

            {/* Ingredients */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-6 border border-green-200 dark:border-green-800">
                <h3 className="font-semibold text-green-800 dark:text-green-200 mb-4">Ingredients to Look For</h3>
                <div className="space-y-2">
                  {recommendations.ingredientsToSeek.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <div>
                        <span className="font-medium">{item.ingredient}</span>
                        <p className="text-sm text-gray-600">{item.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 border border-red-200 dark:border-red-800">
                <h3 className="font-semibold text-red-800 dark:text-red-200 mb-4">Ingredients to Avoid</h3>
                <div className="space-y-2">
                  {recommendations.ingredientsToAvoid.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <span className="text-red-500">✗</span>
                      <div>
                        <span className="font-medium">{item.ingredient}</span>
                        <p className="text-sm text-gray-600">{item.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Expected Results */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Expected Results Timeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { period: "Week 1", result: recommendations.expectedResults.week1 },
                  { period: "Month 1", result: recommendations.expectedResults.month1 },
                  { period: "Month 3", result: recommendations.expectedResults.month3 },
                ].map((item) => (
                  <div key={item.period} className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center">
                    <div className="font-medium text-orange-700 dark:text-orange-300">{item.period}</div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.result}</p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setShowForm(true); setRecommendations(null); }}
              className="w-full py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Get New Recommendations
            </button>
          </div>
        ) : (
          /* Dashboard */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 text-center">
              <ShoppingBag className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Get Product Recommendations</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Tell us about your skin and hair, and we'll recommend the perfect products for your unique needs.
              </p>
              <button onClick={() => setShowForm(true)} className="px-8 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                Start Now
              </button>
            </div>

            {/* History */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Recommendations</h3>
              {records.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No recommendations yet</p>
              ) : (
                <div className="space-y-3">
                  {records.slice(0, 5).map((record) => (
                    <div key={record.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center">
                      <div>
                        <p className="font-medium capitalize">{record.skinType || "N/A"} / {record.hairType || "N/A"}</p>
                        <p className="text-xs text-gray-500">{new Date(record.createdAt).toLocaleDateString()}</p>
                      </div>
                      <button onClick={() => setConfirmDeleteId(record.id)} className="p-1 hover:bg-gray-200 rounded">
                        <Trash2 className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onConfirm={() => {
          if (confirmDeleteId) handleDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
        title="Delete Recommendation"
        description="Delete this recommendation?"
        confirmLabel="Delete"
        variant="destructive"
      />
    </div>
  );
}
