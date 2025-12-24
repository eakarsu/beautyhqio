import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { createMetadata, generateFAQSchema } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Pricing - Affordable Plans for Every Salon Size",
  description:
    "Simple, transparent pricing for BeautyHQ. Starting at $29/month. 14-day free trial, no credit card required. Compare plans and find the perfect fit for your salon or spa.",
  path: "/pricing",
});

const pricingFaqs = [
  { question: "Can I change plans later?", answer: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle." },
  { question: "What payment methods do you accept?", answer: "We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe integration." },
  { question: "Is there a contract?", answer: "No long-term contracts. All plans are month-to-month and you can cancel anytime." },
  { question: "Do you offer discounts for annual billing?", answer: "Yes! Pay annually and get 2 months free (17% savings)." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Simple, Transparent Pricing
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Start with a 14-day free trial. No credit card required. Cancel anytime.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* STARTER */}
          <Card className="border-2 border-gray-200 relative">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">STARTER</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$0</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-rose-600 font-medium mt-1">9% commission on leads</p>
              <CardDescription className="mt-2">Get started for free</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href="/register">
                <Button className="w-full mb-6" variant="outline">Start Free</Button>
              </Link>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> 9% commission on leads
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Listed on marketplace
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Basic profile
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Email support
                </li>
              </ul>
            </div>
          </Card>

          {/* GROWTH */}
          <Card className="border-2 border-rose-500 relative shadow-xl scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">GROWTH</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-rose-600 font-medium mt-1">No commission on leads</p>
              <CardDescription className="mt-2">Perfect for growing salons</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href="/register">
                <Button className="w-full mb-6 bg-rose-600 hover:bg-rose-700">Start Free Trial</Button>
              </Link>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> No commission on leads
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Featured placement
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Analytics dashboard
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Priority support
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Marketing tools
                </li>
              </ul>
            </div>
          </Card>

          {/* PRO */}
          <Card className="border-2 border-gray-200 relative">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">PRO</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$149</span>
                <span className="text-gray-500">/month</span>
              </div>
              <p className="text-sm text-rose-600 font-medium mt-1">No commission on leads</p>
              <CardDescription className="mt-2">Best for established salons</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href="/register">
                <Button className="w-full mb-6" variant="outline">Start Free Trial</Button>
              </Link>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> No commission on leads
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Top placement in search
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Verified badge
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Dedicated account manager
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Custom integrations
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Priority support 24/7
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Advanced analytics
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Comparison note */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-sm text-gray-500">
            Start free with STARTER plan. Upgrade to GROWTH or PRO to eliminate commission fees and unlock premium features.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Can I change plans later?</h3>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect on your next billing cycle.</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">We accept all major credit cards (Visa, MasterCard, American Express) through our secure Stripe integration.</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Is there a contract?</h3>
              <p className="text-gray-600">No long-term contracts. All plans are month-to-month and you can cancel anytime.</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-2">Do you offer discounts for annual billing?</h3>
              <p className="text-gray-600">Yes! Pay annually and get 2 months free (17% savings).</p>
            </div>
            <div className="bg-white p-6 rounded-xl">
              <h3 className="font-semibold mb-2">What makes BeautyHQ different from competitors?</h3>
              <p className="text-gray-600">BeautyHQ includes AI-powered features like smart scheduling, no-show prediction, and style recommendations at no extra cost. Competitors either don&apos;t offer these or charge premium prices.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-rose-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Start Your Free Trial Today</h2>
          <p className="text-xl opacity-90 mb-8">No credit card required. Full access for 14 days.</p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
