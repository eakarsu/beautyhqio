"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Scissors,
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
  CheckCircle,
  ArrowRight,
  Mail,
  MapPin,
} from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100">
        <div className="animate-pulse">
          <Scissors className="h-12 w-12 text-rose-600" />
        </div>
      </div>
    );
  }

  if (status === "authenticated") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-pink-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-600 rounded-lg">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BeautyHQ</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-gray-600 hover:text-gray-900">Features</Link>
            <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Pricing</Link>
            <Link href="/about" className="text-gray-600 hover:text-gray-900">About</Link>
            <Link href="/contact" className="text-gray-600 hover:text-gray-900">Contact</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="bg-rose-600 hover:bg-rose-700">Start Free Trial</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 rounded-full text-rose-700 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4" />
          AI-Powered Salon Management
        </div>
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6 max-w-4xl mx-auto leading-tight">
          The Complete Solution for Beauty & Wellness Businesses
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Manage appointments, clients, staff, payments, and more. Powered by AI to help you grow
          your business and delight your clients.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Link href="/register">
            <Button size="lg" className="bg-rose-600 hover:bg-rose-700 gap-2">
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/contact">
            <Button size="lg" variant="outline" className="gap-2">
              <Phone className="h-4 w-4" /> Book a Demo
            </Button>
          </Link>
        </div>
        <p className="text-sm text-gray-500 mt-4">No credit card required. 14-day free trial.</p>
      </section>

      {/* Trusted By */}
      <section className="container mx-auto px-4 py-10">
        <p className="text-center text-gray-500 mb-6">Trusted by 1,000+ beauty professionals</p>
        <div className="flex justify-center items-center gap-8 flex-wrap opacity-50">
          <span className="text-2xl font-bold text-gray-400">Luxe Salon</span>
          <span className="text-2xl font-bold text-gray-400">Glow Spa</span>
          <span className="text-2xl font-bold text-gray-400">Style Studio</span>
          <span className="text-2xl font-bold text-gray-400">Beauty Bar</span>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Everything You Need to Run Your Salon
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From scheduling to payments, client management to analytics - all in one powerful platform.
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-blue-100 rounded-lg w-fit mb-2">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Smart Scheduling</CardTitle>
              <CardDescription>
                Online booking, walk-in management, and AI-powered scheduling optimization
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-green-100 rounded-lg w-fit mb-2">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Client Management</CardTitle>
              <CardDescription>
                Complete client profiles, service history, preferences, and loyalty tracking
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-purple-100 rounded-lg w-fit mb-2">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Point of Sale</CardTitle>
              <CardDescription>
                Fast checkout, multiple payment methods, tips, and gift cards
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-amber-100 rounded-lg w-fit mb-2">
                <BarChart3 className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription>
                Revenue reports, staff performance, client insights, and trends
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-rose-100 rounded-lg w-fit mb-2">
                <MessageSquare className="h-6 w-6 text-rose-600" />
              </div>
              <CardTitle>SMS & Marketing</CardTitle>
              <CardDescription>
                Automated reminders, promotions, and targeted marketing campaigns
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-cyan-100 rounded-lg w-fit mb-2">
                <Shield className="h-6 w-6 text-cyan-600" />
              </div>
              <CardTitle>Staff Management</CardTitle>
              <CardDescription>
                Schedules, commissions, tips tracking, and performance analytics
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-orange-100 rounded-lg w-fit mb-2">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
              <CardTitle>Inventory</CardTitle>
              <CardDescription>
                Product tracking, low stock alerts, and vendor management
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="p-3 bg-indigo-100 rounded-lg w-fit mb-2">
                <Star className="h-6 w-6 text-indigo-600" />
              </div>
              <CardTitle>Reviews & Reputation</CardTitle>
              <CardDescription>
                Collect reviews, manage feedback, and boost your online presence
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Link href="/features">
            <Button variant="outline" className="gap-2">
              View All Features <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* AI Features */}
      <section className="container mx-auto px-4 py-20 bg-white rounded-3xl my-10">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 rounded-full text-purple-700 text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Powered by AI
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">AI Features That Set You Apart</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Leverage cutting-edge AI to automate tasks, predict trends, and deliver personalized experiences.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
              <Phone className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Voice Receptionist</h3>
            <p className="text-gray-600">
              24/7 AI-powered phone booking in multiple languages. Never miss a call again.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
              <Star className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Style Recommender</h3>
            <p className="text-gray-600">
              AI suggests styles based on face shape, skin tone, and preferences.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
              <Clock className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">No-Show Predictor</h3>
            <p className="text-gray-600">
              Reduce cancellations with intelligent risk prediction and smart overbooking.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Messaging</h3>
            <p className="text-gray-600">
              AI-generated personalized messages for confirmations, follow-ups, and promotions.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
              <BarChart3 className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Revenue Predictor</h3>
            <p className="text-gray-600">
              Forecast revenue, identify trends, and optimize pricing strategies.
            </p>
          </div>

          <div className="text-center p-6 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
              <Users className="h-8 w-8 text-rose-600" />
            </div>
            <h3 className="font-semibold text-lg mb-2">Client Insights</h3>
            <p className="text-gray-600">
              Deep analytics on client behavior, preferences, and lifetime value.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600">Start free, upgrade when you&apos;re ready.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <Card className="border-2 border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Starter</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$49</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">For solo professionals</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> 1 Staff member
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Online booking
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Client management
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Basic reports
                </li>
              </ul>
            </div>
          </Card>

          <Card className="border-2 border-rose-500 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white px-3 py-1 rounded-full text-sm">
              Most Popular
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Professional</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$99</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">For growing salons</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Up to 5 staff
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> AI features included
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> SMS marketing
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Advanced reports
                </li>
              </ul>
            </div>
          </Card>

          <Card className="border-2 border-gray-200">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold">$199</span>
                <span className="text-gray-500">/month</span>
              </div>
              <CardDescription className="mt-2">For multi-location businesses</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Unlimited staff
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Multiple locations
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Priority support
                </li>
                <li className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500" /> Custom integrations
                </li>
              </ul>
            </div>
          </Card>
        </div>
        <div className="text-center mt-8">
          <Link href="/pricing">
            <Button variant="outline" className="gap-2">
              View Full Pricing <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-rose-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
            Join thousands of beauty professionals using BeautyHQ to grow their business.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 gap-2">
                <Phone className="h-4 w-4" /> Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 mt-20">
        <div className="container mx-auto px-4 py-16">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-rose-600 rounded-lg">
                  <Scissors className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">BeautyHQ</span>
              </div>
              <p className="text-gray-400 mb-4">
                The complete AI-powered platform for beauty and wellness businesses.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@beautyhq.io" className="hover:text-white">hello@beautyhq.io</a>
              </div>
              <div className="flex items-center gap-2 text-sm mt-2">
                <MapPin className="h-4 w-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/features#ai" className="hover:text-white">AI Features</Link></li>
                <li><Link href="/features#integrations" className="hover:text-white">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/careers" className="hover:text-white">Careers</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link href="/security" className="hover:text-white">Security</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} BeautyHQ. All rights reserved.
            </p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-white">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-white">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
