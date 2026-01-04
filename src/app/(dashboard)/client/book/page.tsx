"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Star, Clock } from "lucide-react";

interface Salon {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  avgRating: number;
  reviewCount: number;
  specialties: string[];
  coverImage: string | null;
}

export default function BookAppointmentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isClient) {
      router.push("/dashboard");
      return;
    }
    fetchSalons();
  }, [session, status, router]);

  const fetchSalons = async () => {
    try {
      const response = await fetch("/api/marketplace/salons");
      if (response.ok) {
        const data = await response.json();
        setSalons(data.salons || []);
      }
    } catch (error) {
      console.error("Error fetching salons:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSalons = salons.filter(
    (salon) =>
      salon.name.toLowerCase().includes(search.toLowerCase()) ||
      salon.city?.toLowerCase().includes(search.toLowerCase())
  );

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book Appointment</h1>
        <p className="text-slate-600">Find a salon and book your next visit</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search salons by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
        />
      </div>

      {/* Salon Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSalons.map((salon) => (
          <div
            key={salon.id}
            onClick={() => router.push(`/salon/${salon.slug}`)}
            className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="h-40 bg-gradient-to-br from-rose-100 to-purple-100 flex items-center justify-center">
              {salon.coverImage ? (
                <img
                  src={salon.coverImage}
                  alt={salon.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-4xl">💇</span>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-slate-900">{salon.name}</h3>
              <div className="flex items-center gap-1 text-sm text-slate-500 mt-1">
                <MapPin className="h-3 w-3" />
                <span>
                  {salon.city}, {salon.state}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="text-sm font-medium">
                    {salon.avgRating?.toFixed(1) || "New"}
                  </span>
                </div>
                <span className="text-sm text-slate-400">
                  ({salon.reviewCount} reviews)
                </span>
              </div>
              {salon.specialties?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {salon.specialties.slice(0, 3).map((specialty) => (
                    <span
                      key={specialty}
                      className="px-2 py-0.5 bg-rose-50 text-rose-600 text-xs rounded-full"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredSalons.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <p>No salons found. Try a different search.</p>
        </div>
      )}
    </div>
  );
}
