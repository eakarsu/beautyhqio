"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Globe,
  Instagram,
  Facebook,
  Clock,
  CheckCircle,
  Calendar,
  ChevronRight,
  Building2,
  Home,
  ArrowLeft,
} from "lucide-react";

interface SalonData {
  profile: {
    id: string;
    slug: string;
    headline: string | null;
    description: string | null;
    specialties: string[];
    amenities: string[];
    coverImage: string | null;
    galleryImages: string[];
    avgRating: number | null;
    reviewCount: number;
    priceRange: string | null;
    isVerified: boolean;
  };
  business: {
    id: string;
    name: string;
    type: string;
    logo: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    instagram: string | null;
    facebook: string | null;
  };
  locations: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    phone: string | null;
    operatingHours: any;
  }[];
  servicesByCategory: {
    id: string;
    name: string;
    services: {
      id: string;
      name: string;
      description: string | null;
      duration: number;
      price: number;
      priceType: string;
    }[];
  }[];
  staff: {
    id: string;
    displayName: string | null;
    title: string | null;
    bio: string | null;
    photo: string | null;
    specialties: string[];
    avgRating: number | null;
    reviewCount: number;
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    response: string | null;
    clientName: string;
  }[];
}

export default function SalonProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [data, setData] = useState<SalonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const response = await fetch(`/api/marketplace/salons/${slug}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError("Salon not found");
          } else {
            setError("Failed to load salon");
          }
          return;
        }
        const salonData = await response.json();
        setData(salonData);
        if (salonData.locations.length > 0) {
          setSelectedLocation(salonData.locations[0].id);
        }

        // Track view
        const sessionId = localStorage.getItem("marketplace_session") || crypto.randomUUID();
        localStorage.setItem("marketplace_session", sessionId);

        fetch("/api/marketplace/leads/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            event: "view_profile",
            businessId: salonData.business.id,
          }),
        }).catch(() => {});
      } catch (err) {
        setError("Failed to load salon");
      } finally {
        setLoading(false);
      }
    };

    fetchSalon();
  }, [slug]);

  const handleBookNow = () => {
    if (!data || !selectedLocation) return;

    // Track booking click
    const sessionId = localStorage.getItem("marketplace_session");
    if (sessionId) {
      fetch("/api/marketplace/leads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          event: "start_booking",
          businessId: data.business.id,
          locationId: selectedLocation,
        }),
      }).catch(() => {});
    }

    router.push(`/book/${selectedLocation}/services`);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Skeleton className="h-64 w-full" />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building2 className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">{error || "Salon not found"}</h1>
          <p className="text-gray-600 mb-6">
            This salon may no longer be available.
          </p>
          <Link href="/explore">
            <Button>Browse Salons</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { profile, business, locations, servicesByCategory, staff, reviews } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <div className="bg-white border-b px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Link href="/">
            <Button variant="outline">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>

      {/* Cover Image */}
      <div className="relative h-64 md:h-80 bg-gray-200">
        {profile.coverImage ? (
          <Image
            src={profile.coverImage}
            alt={business.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Building2 className="h-24 w-24 text-gray-400" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{business.name}</h1>
              {profile.isVerified && (
                <Badge className="bg-blue-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Verified
                </Badge>
              )}
            </div>
            {profile.avgRating && (
              <div className="flex items-center gap-2">
                {renderStars(profile.avgRating)}
                <span>
                  {profile.avgRating.toFixed(1)} ({profile.reviewCount} reviews)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {(profile.headline || profile.description) && (
              <Card>
                <CardHeader>
                  <CardTitle>About</CardTitle>
                </CardHeader>
                <CardContent>
                  {profile.headline && (
                    <p className="text-lg font-medium mb-2">{profile.headline}</p>
                  )}
                  {profile.description && (
                    <p className="text-gray-600">{profile.description}</p>
                  )}
                  {profile.specialties.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Specialties</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.specialties.map((specialty, i) => (
                          <Badge key={i} variant="secondary">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Services */}
            <Card>
              <CardHeader>
                <CardTitle>Services</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue={servicesByCategory[0]?.id || "all"}>
                  <TabsList className="mb-4">
                    {servicesByCategory.map((cat) => (
                      <TabsTrigger key={cat.id} value={cat.id}>
                        {cat.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {servicesByCategory.map((cat) => (
                    <TabsContent key={cat.id} value={cat.id}>
                      <div className="space-y-3">
                        {cat.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
                          >
                            <div>
                              <p className="font-medium">{service.name}</p>
                              {service.description && (
                                <p className="text-sm text-gray-500">
                                  {service.description}
                                </p>
                              )}
                              <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                <Clock className="h-3 w-3" />
                                {service.duration} min
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold">
                                {service.priceType === "STARTING_AT" && "From "}$
                                {service.price}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>

            {/* Staff */}
            {staff.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Our Team</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {staff.map((member) => (
                      <div key={member.id} className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-2 rounded-full overflow-hidden bg-gray-200">
                          {member.photo ? (
                            <Image
                              src={member.photo}
                              alt={member.displayName || "Staff"}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-gray-400 text-2xl font-bold">
                              {(member.displayName || "S")[0]}
                            </div>
                          )}
                        </div>
                        <p className="font-medium">
                          {member.displayName || "Team Member"}
                        </p>
                        {member.title && (
                          <p className="text-sm text-gray-500">{member.title}</p>
                        )}
                        {member.avgRating && (
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm">
                              {member.avgRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Reviews</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-medium">{review.clientName}</p>
                            <div className="flex items-center gap-2">
                              {renderStars(review.rating)}
                              <span className="text-sm text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-600">{review.comment}</p>
                        )}
                        {review.response && (
                          <div className="mt-3 pl-4 border-l-2 border-gray-200">
                            <p className="text-sm font-medium">Response:</p>
                            <p className="text-sm text-gray-600">{review.response}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Book Now Card */}
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Book an Appointment</CardTitle>
              </CardHeader>
              <CardContent>
                {locations.length > 1 && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">
                      Select Location
                    </label>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={selectedLocation || ""}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                    >
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} - {loc.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <Button onClick={handleBookNow} className="w-full" size="lg">
                  <Calendar className="h-4 w-4 mr-2" />
                  Book Now
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>

                <p className="text-center text-sm text-gray-500 mt-3">
                  Free cancellation up to 24 hours before
                </p>
              </CardContent>
            </Card>

            {/* Location Info */}
            {locations[0] && (
              <Card>
                <CardHeader>
                  <CardTitle>Location</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-1 text-gray-500" />
                    <div>
                      <p>{locations[0].address}</p>
                      <p>
                        {locations[0].city}, {locations[0].state} {locations[0].zip}
                      </p>
                    </div>
                  </div>
                  {locations[0].phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <a href={`tel:${locations[0].phone}`} className="hover:underline">
                        {locations[0].phone}
                      </a>
                    </div>
                  )}
                  {business.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <a href={`mailto:${business.email}`} className="hover:underline">
                        {business.email}
                      </a>
                    </div>
                  )}
                  {business.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-500" />
                      <a
                        href={business.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            {(business.instagram || business.facebook) && (
              <Card>
                <CardHeader>
                  <CardTitle>Follow Us</CardTitle>
                </CardHeader>
                <CardContent className="flex gap-3">
                  {business.instagram && (
                    <a
                      href={`https://instagram.com/${business.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Instagram className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                  {business.facebook && (
                    <a
                      href={business.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon">
                        <Facebook className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
