"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Star } from "lucide-react";

interface Location {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  phone: string;
  hours: any;
}

export default function BookingPage() {
  const router = useRouter();
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/locations?isActive=true")
      .then((res) => res.json())
      .then((data) => {
        setLocations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelectLocation = (locationId: string) => {
    router.push(`/book/${locationId}/services`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Book Your Appointment
          </h1>
          <p className="text-lg text-gray-600">
            Select a location to get started
          </p>
        </div>

        {/* Locations Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {locations.map((location) => (
            <Card
              key={location.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleSelectLocation(location.id)}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-pink-600" />
                  {location.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-600">
                    {location.address}
                    <br />
                    {location.city}, {location.state}
                  </p>
                  <p className="text-gray-600">{location.phone}</p>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-gray-600 text-sm ml-2">4.9 (120+ reviews)</span>
                  </div>
                  <Button className="w-full mt-4 bg-pink-600 hover:bg-pink-700">
                    Select Location
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {locations.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <p className="text-gray-500">No locations available at this time.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
