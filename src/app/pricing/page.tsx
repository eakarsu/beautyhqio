import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, ArrowRight, X } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";

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
          {/* Starter */}
          <Card className="border-2 border-gray-200 relative">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Starter</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$29</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">Perfect for solo professionals</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href="/register">
                <Button className="w-full mb-6" variant="outline">Start Free Trial</Button>
              </Link>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> 1 Staff member
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Unlimited clients
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Online booking
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Client management
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Basic POS
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Email reminders
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Basic reports
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <X className="h-4 w-4 shrink-0" /> SMS marketing
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-400">
                  <X className="h-4 w-4 shrink-0" /> AI features
                </li>
              </ul>
            </div>
          </Card>

          {/* Professional */}
          <Card className="border-2 border-rose-500 relative shadow-xl scale-105">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-4 py-1 rounded-full text-sm font-medium">
              Most Popular
            </div>
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Professional</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$59</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">For growing salons & teams</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href="/register">
                <Button className="w-full mb-6 bg-rose-600 hover:bg-rose-700">Start Free Trial</Button>
              </Link>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Up to 5 staff members
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Unlimited clients
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Online booking
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Full POS with tips
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> SMS reminders (500/mo)
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> AI features included
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Advanced reports
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Loyalty program
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Gift cards
                </li>
              </ul>
            </div>
          </Card>

          {/* Enterprise */}
          <Card className="border-2 border-gray-200 relative">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-5xl font-bold">$149</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">For multi-location businesses</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href="/contact">
                <Button className="w-full mb-6" variant="outline">Contact Sales</Button>
              </Link>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Unlimited staff
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Multiple locations
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Everything in Pro
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Unlimited SMS
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> AI Voice Receptionist
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Priority support
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Custom integrations
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> Dedicated account manager
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> API access
                </li>
              </ul>
            </div>
          </Card>
        </div>

        {/* Comparison note */}
        <div className="text-center mt-12 max-w-2xl mx-auto">
          <p className="text-sm text-gray-500">
            Compare to competitors: Vagaro ($30-70/mo), Booksy ($29.99/mo + $20/user), Fresha ($19.95/mo solo).
            BeautyHQ includes AI features at no extra cost - competitors charge extra or don&apos;t offer them.
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
