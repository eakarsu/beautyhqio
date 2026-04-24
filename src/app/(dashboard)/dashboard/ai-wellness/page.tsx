"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Brain,
  Sparkles,
  Moon,
  Users,
  ShoppingBag,
  Gift,
  Calendar,
  ArrowRight,
  Heart,
  Zap,
} from "lucide-react";

const aiFeatures = [
  {
    id: "symptom-checker",
    title: "AI Symptom Checker",
    description: "Analyze wellness symptoms and get personalized recommendations for skin, hair, and body concerns.",
    icon: Activity,
    color: "bg-red-500",
    href: "/dashboard/ai-wellness/symptom-checker",
    features: ["Skin condition analysis", "Hair & scalp assessment", "Wellness recommendations", "Service suggestions"],
  },
  {
    id: "mental-health",
    title: "AI Mental Health Companion",
    description: "Supportive wellness companion for stress management, self-care, and emotional wellbeing.",
    icon: Brain,
    color: "bg-purple-500",
    href: "/dashboard/ai-wellness/mental-health",
    features: ["Mood tracking", "Coping strategies", "Relaxation techniques", "Self-care recommendations"],
  },
  {
    id: "skin-analyzer",
    title: "AI Skin Analyzer",
    description: "Comprehensive skin analysis with personalized skincare routines and product recommendations.",
    icon: Sparkles,
    color: "bg-pink-500",
    href: "/dashboard/ai-wellness/skin-analyzer",
    features: ["Skin type assessment", "Concern analysis", "Routine builder", "Treatment suggestions"],
  },
  {
    id: "sleep-coach",
    title: "AI Sleep Coach",
    description: "Track and improve your beauty sleep with personalized coaching and insights.",
    icon: Moon,
    color: "bg-indigo-500",
    href: "/dashboard/ai-wellness/sleep-coach",
    features: ["Sleep tracking", "Quality analysis", "Beauty sleep tips", "Environment optimization"],
  },
  {
    id: "posture-corrector",
    title: "AI Posture Corrector",
    description: "Assess your posture and get exercises, ergonomic tips, and improvement plans.",
    icon: Users,
    color: "bg-green-500",
    href: "/dashboard/ai-wellness/posture-corrector",
    features: ["Posture assessment", "Exercise recommendations", "Ergonomic tips", "Progress tracking"],
  },
  {
    id: "product-recommender",
    title: "AI Product Recommender",
    description: "Get personalized beauty and wellness product recommendations based on your unique profile.",
    icon: ShoppingBag,
    color: "bg-orange-500",
    href: "/dashboard/ai-wellness/product-recommender",
    features: ["Personalized products", "Routine suggestions", "Budget options", "Ingredient guidance"],
  },
  {
    id: "loyalty-optimizer",
    title: "AI Loyalty Program Manager",
    description: "Optimize your loyalty program with AI-powered insights and recommendations.",
    icon: Gift,
    color: "bg-yellow-500",
    href: "/dashboard/ai-wellness/loyalty-optimizer",
    features: ["Program analysis", "Reward optimization", "Engagement strategies", "ROI projections"],
  },
  {
    id: "appointment-optimizer",
    title: "AI Appointment Optimizer",
    description: "Smart scheduling optimization to maximize efficiency and reduce no-shows.",
    icon: Calendar,
    color: "bg-blue-500",
    href: "/dashboard/ai-wellness/appointment-optimizer",
    features: ["No-show prediction", "Optimal scheduling", "Staff matching", "Revenue optimization"],
  },
];

export default function AIWellnessPage() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                AI Wellness Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Powered by AI to enhance your beauty and wellness journey
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {aiFeatures.map((feature) => {
            const Icon = feature.icon;
            const isHovered = hoveredCard === feature.id;

            return (
              <Link
                key={feature.id}
                href={feature.href}
                className="group"
                onMouseEnter={() => setHoveredCard(feature.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div
                  className={`
                    relative bg-white dark:bg-gray-800 rounded-2xl p-6
                    border-2 transition-all duration-300 cursor-pointer
                    ${isHovered
                      ? "border-purple-500 shadow-xl shadow-purple-500/20 -translate-y-1"
                      : "border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg"
                    }
                  `}
                >
                  {/* Icon */}
                  <div
                    className={`
                      w-14 h-14 rounded-xl flex items-center justify-center mb-4
                      transition-transform duration-300
                      ${feature.color}
                      ${isHovered ? "scale-110" : ""}
                    `}
                  >
                    <Icon className="h-7 w-7 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {feature.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-1 mb-4">
                    {feature.features.slice(0, 3).map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"
                      >
                        <Heart className="h-3 w-3 text-pink-500" />
                        {item}
                      </li>
                    ))}
                  </ul>

                  {/* Action */}
                  <div
                    className={`
                      flex items-center gap-2 text-sm font-medium
                      transition-colors duration-300
                      ${isHovered ? "text-purple-600" : "text-gray-400"}
                    `}
                  >
                    <span>Explore</span>
                    <ArrowRight
                      className={`h-4 w-4 transition-transform duration-300 ${
                        isHovered ? "translate-x-1" : ""
                      }`}
                    />
                  </div>

                  {/* Hover Gradient */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 rounded-2xl pointer-events-none" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            AI-Powered Insights
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">8</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">AI Features</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">24/7</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600">Instant</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">100%</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Personalized</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
