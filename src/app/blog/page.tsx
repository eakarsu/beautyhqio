import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowRight, Calendar, Clock } from "lucide-react";
import Link from "next/link";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { createMetadata } from "@/lib/seo";

export const metadata: Metadata = createMetadata({
  title: "Blog - Beauty Industry Tips, Trends & Insights",
  description:
    "Expert insights, tips, and strategies to help you grow your beauty business. Learn about salon marketing, client retention, AI technology, and more.",
  path: "/blog",
});

export default function BlogPage() {
  const featuredPost = {
    slug: "ai-transforming-beauty-industry",
    title: "5 Ways AI is Transforming the Beauty Industry",
    excerpt: "Discover how artificial intelligence is revolutionizing salon operations and client experiences. From smart scheduling to personalized recommendations.",
    date: "December 10, 2024",
    readTime: "5 min read",
    category: "AI & Technology",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&h=600&fit=crop",
    author: {
      name: "Sarah Mitchell",
      role: "Head of Product",
      avatar: "SM",
    },
  };

  const posts = [
    {
      slug: "reduce-no-shows",
      title: "How to Reduce No-Shows by 50%",
      excerpt: "Practical strategies and tools to minimize appointment cancellations and maximize your revenue.",
      date: "December 5, 2024",
      readTime: "4 min read",
      category: "Business Tips",
      image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&h=500&fit=crop",
      author: {
        name: "James Rodriguez",
        avatar: "JR",
      },
    },
    {
      slug: "building-client-loyalty",
      title: "Building Client Loyalty in 2025",
      excerpt: "Learn the proven techniques top salons use to keep clients coming back.",
      date: "November 28, 2024",
      readTime: "6 min read",
      category: "Client Management",
      image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&h=500&fit=crop",
      author: {
        name: "Emily Watson",
        avatar: "EW",
      },
    },
    {
      slug: "salon-marketing-guide",
      title: "The Complete Guide to Salon Marketing",
      excerpt: "From social media to email campaigns, everything you need to attract new clients.",
      date: "November 20, 2024",
      readTime: "8 min read",
      category: "Marketing",
      image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=500&fit=crop",
      author: {
        name: "Michael Torres",
        avatar: "MT",
      },
    },
  ];

  const categories = ["All", "AI & Technology", "Business Tips", "Client Management", "Marketing"];

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />

      {/* Hero */}
      <section className="bg-gradient-to-br from-rose-50 to-pink-50 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              BeautyHQ Blog
            </h1>
            <p className="text-xl text-gray-600">
              Expert insights, tips, and strategies to help you grow your beauty business.
            </p>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 overflow-x-auto py-4 -mx-4 px-4">
            {categories.map((category, index) => (
              <button
                key={category}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  index === 0
                    ? "bg-rose-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Post */}
      <section className="container mx-auto px-4 py-12">
        <Link href={`/blog/${featuredPost.slug}`}>
          <div className="group relative rounded-2xl overflow-hidden bg-gray-900">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${featuredPost.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
            </div>
            <div className="relative p-8 md:p-12 min-h-[400px] md:min-h-[500px] flex flex-col justify-end">
              <div className="max-w-2xl">
                <span className="inline-block px-3 py-1 bg-rose-600 text-white text-sm font-medium rounded-full mb-4">
                  {featuredPost.category}
                </span>
                <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 group-hover:text-rose-200 transition-colors">
                  {featuredPost.title}
                </h2>
                <p className="text-white/80 text-lg mb-6 line-clamp-2">
                  {featuredPost.excerpt}
                </p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-rose-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                      {featuredPost.author.avatar}
                    </div>
                    <div>
                      <div className="text-white font-medium text-sm">{featuredPost.author.name}</div>
                      <div className="text-white/60 text-xs">{featuredPost.author.role}</div>
                    </div>
                  </div>
                  <span className="text-white/60 text-sm flex items-center gap-1">
                    <Calendar className="h-4 w-4" /> {featuredPost.date}
                  </span>
                  <span className="text-white/60 text-sm flex items-center gap-1">
                    <Clock className="h-4 w-4" /> {featuredPost.readTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </section>

      {/* Latest Posts */}
      <section className="container mx-auto px-4 pb-16">
        <h2 className="text-2xl font-bold mb-8">Latest Articles</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <article className="group h-full">
                <div className="relative rounded-xl overflow-hidden mb-4 aspect-[16/10]">
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${post.image})` }}
                  />
                </div>
                <span className="text-rose-600 text-sm font-medium">{post.category}</span>
                <h3 className="text-xl font-bold text-gray-900 mt-2 mb-2 group-hover:text-rose-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 font-medium text-xs">
                      {post.author.avatar}
                    </div>
                    <span>{post.author.name}</span>
                  </div>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {post.readTime}
                  </span>
                </div>
              </article>
            </Link>
          ))}
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900 py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Stay Ahead of the Curve</h2>
            <p className="text-gray-400 mb-8">
              Get the latest beauty industry insights, tips, and strategies delivered to your inbox weekly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border-0 bg-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:ring-2 focus:ring-rose-500"
              />
              <Button className="bg-rose-600 hover:bg-rose-700 px-6 py-3">
                Subscribe
              </Button>
            </div>
            <p className="text-gray-500 text-xs mt-4">
              Join 5,000+ beauty professionals. Unsubscribe anytime.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Salon?</h2>
          <p className="text-xl opacity-90 mb-8 max-w-xl mx-auto">
            See why 1,000+ beauty professionals trust BeautyHQ to manage their business.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="gap-2">
                Start Free Trial <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10">
                Book a Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
