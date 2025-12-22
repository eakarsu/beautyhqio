"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  MapPin,
  Star,
  Clock,
  DollarSign,
  ChevronRight,
  Filter,
  Building2,
} from "lucide-react";

interface Salon {
  id: string;
  slug: string;
  businessId: string;
  name: string;
  type: string;
  logo: string | null;
  coverImage: string | null;
  headline: string | null;
  specialties: string[];
  avgRating: number | null;
  reviewCount: number;
  priceRange: string | null;
  isVerified: boolean;
  location: {
    city: string;
    state: string;
    address: string;
  } | null;
  featuredServices: {
    id: string;
    name: string;
    price: number;
    duration: number;
  }[];
}

const BUSINESS_TYPES = [
  { value: "all", label: "All Categories" },
  { value: "HAIR_SALON", label: "Hair Salons" },
  { value: "BARBERSHOP", label: "Barbershops" },
  { value: "NAIL_SALON", label: "Nail Salons" },
  { value: "SPA", label: "Spas" },
  { value: "MASSAGE", label: "Massage" },
  { value: "LASH_BROW", label: "Lash & Brow" },
  { value: "WAXING", label: "Waxing" },
  { value: "MAKEUP", label: "Makeup" },
  { value: "WELLNESS", label: "Wellness" },
];

function ExplorePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Search state
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [city, setCity] = useState(searchParams.get("city") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "rating");

  // Fetch salons
  useEffect(() => {
    const fetchSalons = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (query) params.set("q", query);
        if (city) params.set("city", city);
        if (category && category !== "all") params.set("category", category);
        if (sortBy) params.set("sortBy", sortBy);

        const response = await fetch(`/api/marketplace/salons?${params}`);
        const data = await response.json();

        setSalons(data.salons || []);
        setTotal(data.total || 0);
      } catch (error) {
        console.error("Error fetching salons:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalons();
  }, [query, city, category, sortBy]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Update URL with search params
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (city) params.set("city", city);
    if (category && category !== "all") params.set("category", category);
    router.push(`/explore?${params.toString()}`);
  };

  const formatBusinessType = (type: string) => {
    return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Find Your Perfect Salon</h1>
          <p className="text-gray-600">
            Discover and book appointments at top-rated beauty and wellness businesses near you
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <form onSubmit={handleSearch} className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search salons, services..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[200px]">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {BUSINESS_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
        </div>
      </div>

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-600">
            {loading ? "Searching..." : `${total} salons found`}
          </p>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Top Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Salon grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-48 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : salons.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">No salons found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters to find more results.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {salons.map((salon) => (
              <Link key={salon.id} href={`/salon/${salon.slug}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardContent className="p-0">
                    {/* Cover image */}
                    <div className="relative h-48 bg-gray-200">
                      {salon.coverImage ? (
                        <Image
                          src={salon.coverImage}
                          alt={salon.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <Building2 className="h-12 w-12 text-gray-400" />
                        </div>
                      )}
                      {salon.isVerified && (
                        <Badge className="absolute top-3 left-3 bg-blue-500">
                          Verified
                        </Badge>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{salon.name}</h3>
                          <p className="text-sm text-gray-500">
                            {formatBusinessType(salon.type)}
                          </p>
                        </div>
                        {salon.avgRating && (
                          <div className="flex items-center gap-1 text-sm">
                            {renderStars(salon.avgRating)}
                            <span className="text-gray-500">
                              ({salon.reviewCount})
                            </span>
                          </div>
                        )}
                      </div>

                      {salon.location && (
                        <p className="text-sm text-gray-600 flex items-center gap-1 mb-3">
                          <MapPin className="h-3 w-3" />
                          {salon.location.city}, {salon.location.state}
                        </p>
                      )}

                      {salon.headline && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {salon.headline}
                        </p>
                      )}

                      {/* Featured services */}
                      {salon.featuredServices.length > 0 && (
                        <div className="space-y-1">
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            Popular Services
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {salon.featuredServices.slice(0, 3).map((service) => (
                              <Badge
                                key={service.id}
                                variant="secondary"
                                className="text-xs"
                              >
                                {service.name} - ${service.price}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price range */}
                      {salon.priceRange && (
                        <div className="mt-3 flex items-center gap-1 text-sm text-gray-600">
                          <DollarSign className="h-3 w-3" />
                          <span>{salon.priceRange}</span>
                        </div>
                      )}
                    </div>

                    {/* Book button */}
                    <div className="px-4 pb-4">
                      <Button className="w-full" variant="outline">
                        View & Book
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ExplorePageContent />
    </Suspense>
  );
}
