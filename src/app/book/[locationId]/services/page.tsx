"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Check } from "lucide-react";

interface ServiceCategory {
  id: string;
  name: string;
}

interface Service {
  id: string;
  name: string;
  description: string;
  category: ServiceCategory | null;
  price: number;
  duration: number;
}

export default function SelectServicesPage({
  params,
}: {
  params: Promise<{ locationId: string }>;
}) {
  const { locationId } = use(params);
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/services?locationId=${locationId}&isActive=true`)
      .then((res) => res.json())
      .then((data) => {
        setServices(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [locationId]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleContinue = () => {
    if (selectedServices.length > 0) {
      const serviceIds = selectedServices.join(",");
      router.push(`/book/${locationId}/datetime?services=${serviceIds}`);
    }
  };

  const selectedServiceData = services.filter((s) => selectedServices.includes(s.id));
  const totalDuration = selectedServiceData.reduce((sum, s) => sum + Number(s.duration), 0);
  const totalPrice = selectedServiceData.reduce((sum, s) => sum + Number(s.price), 0);

  // Group services by category name
  const categories = [...new Set(services.map((s) => s.category?.name || "Other"))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Select Services
          </h1>
          <p className="text-gray-600">
            Choose one or more services for your appointment
          </p>
        </div>

        {/* Services by Category */}
        {services.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No services available at this location.</p>
            <Button variant="outline" onClick={() => router.back()} className="mt-4">
              Go Back
            </Button>
          </div>
        ) : (
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                {category}
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {services
                  .filter((s) => (s.category?.name || "Other") === category)
                  .map((service) => {
                    const isSelected = selectedServices.includes(service.id);
                    return (
                      <Card
                        key={service.id}
                        className={`cursor-pointer transition-all ${
                          isSelected
                            ? "border-pink-600 bg-pink-50 shadow-md"
                            : "hover:shadow-md"
                        }`}
                        onClick={() => toggleService(service.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">
                                {service.name}
                              </h3>
                              {service.description && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {service.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {service.duration} min
                                </span>
                                <span className="font-medium text-pink-600">
                                  ${Number(service.price).toFixed(2)}
                                </span>
                              </div>
                            </div>
                            <div
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                                isSelected
                                  ? "bg-pink-600 border-pink-600"
                                  : "border-gray-300"
                              }`}
                            >
                              {isSelected && (
                                <Check className="h-4 w-4 text-white" />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Summary Footer */}
        {selectedServices.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {selectedServices.length} service(s) selected
                </p>
                <p className="font-semibold">
                  {totalDuration} min • ${totalPrice.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={handleContinue}
                className="bg-pink-600 hover:bg-pink-700"
              >
                Continue
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
