import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { Heart, Zap, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "About Us - Our Mission to Empower Beauty Professionals",
  description:
    "Learn about BeautyHQ's mission to empower beauty and wellness professionals with cutting-edge AI technology. Founded in 2024, we help 1,000+ businesses grow.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          About BeautyHQ
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          We&apos;re on a mission to empower beauty and wellness professionals with
          the best technology to grow their businesses.
        </p>
      </section>

      {/* Story */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <div className="prose prose-lg text-gray-600">
            <p className="mb-4">
              BeautyHQ was founded in 2024 with a simple idea: beauty professionals deserve
              better tools. After spending years watching talented stylists, estheticians, and
              wellness practitioners struggle with outdated software and manual processes,
              we knew there had to be a better way.
            </p>
            <p className="mb-4">
              We built BeautyHQ from the ground up, combining cutting-edge AI technology with
              deep industry knowledge. Our team includes former salon owners, software engineers
              from top tech companies, and AI researchers who are passionate about creating
              tools that actually work for real businesses.
            </p>
            <p>
              Today, BeautyHQ helps thousands of beauty and wellness businesses manage their
              operations, delight their clients, and grow their revenue. And we&apos;re just
              getting started.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-gray-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
                <Heart className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Customer First</h3>
              <p className="text-gray-600">
                Every feature we build starts with understanding our customers&apos; needs.
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
                <Zap className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600">
                We leverage the latest AI technology to solve real problems.
              </p>
            </div>
            <div className="text-center">
              <div className="p-4 bg-rose-100 rounded-full w-fit mx-auto mb-4">
                <Users className="h-8 w-8 text-rose-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Community</h3>
              <p className="text-gray-600">
                We&apos;re building more than software - we&apos;re building a community.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-rose-600 mb-2">1,000+</div>
            <p className="text-gray-600">Businesses</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-rose-600 mb-2">50,000+</div>
            <p className="text-gray-600">Appointments/Month</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-rose-600 mb-2">99.9%</div>
            <p className="text-gray-600">Uptime</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-rose-600 mb-2">4.9/5</div>
            <p className="text-gray-600">Customer Rating</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-rose-600 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Join Our Journey</h2>
          <p className="text-xl opacity-90 mb-8">Start your free trial and see the difference.</p>
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
