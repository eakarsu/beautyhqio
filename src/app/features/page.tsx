import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createMetadata } from "@/lib/seo";
import {
  Calendar,
  Users,
  CreditCard,
  BarChart3,
  Sparkles,
  Clock,
  Star,
  Phone,
  MessageSquare,
  Shield,
  Zap,
  Gift,
  Globe,
  Smartphone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

export const metadata: Metadata = createMetadata({
  title: "Features - Complete Salon & Spa Management Tools",
  description:
    "Discover BeautyHQ's powerful features: AI scheduling, client management, POS, marketing automation, inventory tracking, and more. Everything you need to run your beauty business.",
  path: "/features",
});

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Powerful Features for Your Business
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Everything you need to manage appointments, clients, staff, and payments - all in one platform.
        </p>
      </section>

      {/* Core Features */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-2">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                Online booking widget, recurring appointments, walk-in management, waitlist,
                and AI-powered scheduling optimization to maximize your calendar.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-2">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>
                Complete client profiles, service history, photos, formulas,
                preferences, family accounts, and automatic loyalty tracking.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-2">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Point of Sale</CardTitle>
              <CardDescription>
                Fast checkout, split payments, tips, gift cards, packages,
                memberships, and seamless Stripe integration.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-amber-100 rounded-lg w-fit mb-2">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                Revenue reports, staff performance, client retention,
                product sales, and custom report builder.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-rose-100 rounded-lg w-fit mb-2">
                <MessageSquare className="h-6 w-6 text-rose-600" />
              </div>
              <CardTitle>SMS & Email Marketing</CardTitle>
              <CardDescription>
                Automated appointment reminders, birthday messages,
                re-engagement campaigns, and bulk messaging.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-cyan-100 rounded-lg w-fit mb-2">
                <Shield className="h-6 w-6 text-cyan-600" />
              </div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>
                Employee schedules, time-off requests, commission tracking,
                tip distribution, and performance dashboards.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-orange-100 rounded-lg w-fit mb-2">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription>
                Product catalog, stock tracking, low inventory alerts,
                vendor management, and purchase orders.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-2">
                <Gift className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Loyalty & Gift Cards</CardTitle>
              <CardDescription>
                Points-based loyalty program, tier rewards, digital gift cards,
                referral tracking, and package deals.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 hover:border-rose-200 transition-colors">
            <CardHeader>
              <div className="p-3 bg-pink-100 rounded-lg w-fit mb-2">
                <Star className="h-6 w-6 text-pink-600" />
              </div>
              <CardTitle>Reviews & Reputation</CardTitle>
              <CardDescription>
                Collect reviews, AI-generated responses, monitor online reputation,
                and boost your presence on Google and Yelp.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* AI Features */}
      <section id="ai" className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4" />
              AI-Powered
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Artificial Intelligence Features</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Leverage cutting-edge AI to automate tasks and deliver personalized experiences.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Phone className="h-8 w-8 text-rose-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">AI Voice Receptionist</h3>
              <p className="text-gray-600 mb-4">
                24/7 phone answering in multiple languages. Books appointments, answers questions,
                and transfers to staff when needed.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Multi-language support</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Natural conversations</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Smart call routing</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Star className="h-8 w-8 text-rose-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Style Recommender</h3>
              <p className="text-gray-600 mb-4">
                AI analyzes face shape, skin tone, and preferences to suggest
                personalized style recommendations.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Photo analysis</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Trend suggestions</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Client preferences</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Clock className="h-8 w-8 text-rose-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">No-Show Predictor</h3>
              <p className="text-gray-600 mb-4">
                Reduce cancellations with intelligent risk scoring. Automatically
                send extra reminders to high-risk appointments.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Risk scoring</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Smart overbooking</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Automated reminders</li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <BarChart3 className="h-8 w-8 text-rose-600 mb-4" />
              <h3 className="font-semibold text-lg mb-2">Revenue Predictor</h3>
              <p className="text-gray-600 mb-4">
                Forecast revenue, identify trends, and get AI-powered
                recommendations to optimize your pricing.
              </p>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Revenue forecasting</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Price optimization</li>
                <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Demand prediction</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section id="integrations" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Integrations</h2>
          <p className="text-gray-600">Connect with your favorite tools</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="p-4 bg-gray-100 rounded-xl mb-2 inline-block">
              <Globe className="h-8 w-8 text-gray-600" />
            </div>
            <p className="font-medium">Google Calendar</p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-gray-100 rounded-xl mb-2 inline-block">
              <CreditCard className="h-8 w-8 text-gray-600" />
            </div>
            <p className="font-medium">Stripe</p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-gray-100 rounded-xl mb-2 inline-block">
              <MessageSquare className="h-8 w-8 text-gray-600" />
            </div>
            <p className="font-medium">Twilio SMS</p>
          </div>
          <div className="text-center">
            <div className="p-4 bg-gray-100 rounded-xl mb-2 inline-block">
              <Smartphone className="h-8 w-8 text-gray-600" />
            </div>
            <p className="font-medium">QuickBooks</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-rose-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl opacity-90 mb-8">Start your 14-day free trial today.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
