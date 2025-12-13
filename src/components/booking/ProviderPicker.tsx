"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Users, Check, Clock } from "lucide-react";

interface Provider {
  id: string;
  name: string;
  title?: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  specialties?: string[];
  nextAvailable?: string;
}

interface ProviderPickerProps {
  serviceIds: string[];
  selectedProvider?: Provider;
  onSelect: (provider: Provider) => void;
  allowAnyProvider?: boolean;
}

export function ProviderPicker({
  serviceIds,
  selectedProvider,
  onSelect,
  allowAnyProvider = true,
}: ProviderPickerProps) {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchProviders();
  }, [serviceIds]);

  const fetchProviders = async () => {
    try {
      const params = new URLSearchParams();
      serviceIds.forEach((id) => params.append("serviceId", id));

      const response = await fetch(`/api/staff/available?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProviders(data);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      // Demo data
      setProviders([
        {
          id: "p1",
          name: "Sarah Johnson",
          title: "Senior Stylist",
          rating: 4.9,
          reviewCount: 127,
          specialties: ["Color", "Balayage", "Cuts"],
          nextAvailable: "Today at 2:00 PM",
        },
        {
          id: "p2",
          name: "Mike Brown",
          title: "Master Colorist",
          rating: 4.8,
          reviewCount: 89,
          specialties: ["Color", "Highlights", "Treatments"],
          nextAvailable: "Tomorrow at 10:00 AM",
        },
        {
          id: "p3",
          name: "Lisa Williams",
          title: "Stylist",
          rating: 4.7,
          reviewCount: 65,
          specialties: ["Cuts", "Styling", "Blowouts"],
          nextAvailable: "Today at 4:30 PM",
        },
        {
          id: "p4",
          name: "Emily Chen",
          title: "Junior Stylist",
          rating: 4.6,
          reviewCount: 32,
          specialties: ["Cuts", "Color", "Styling"],
          nextAvailable: "Today at 11:00 AM",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading available providers...
      </div>
    );
  }

  return (
    <ScrollArea className="h-[400px] pr-4">
      <div className="space-y-3">
        {/* Any Provider Option */}
        {allowAnyProvider && (
          <Card
            className={`cursor-pointer transition-all ${
              selectedProvider?.id === "any"
                ? "border-rose-500 bg-rose-50"
                : "hover:border-gray-300"
            }`}
            onClick={() =>
              onSelect({ id: "any", name: "First Available" })
            }
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-rose-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">First Available</h4>
                    {selectedProvider?.id === "any" && (
                      <Check className="h-4 w-4 text-rose-600" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    We'll match you with the next available provider
                  </p>
                </div>
                <Badge variant="secondary" className="text-green-600">
                  Fastest
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Individual Providers */}
        {providers.map((provider) => {
          const isSelected = selectedProvider?.id === provider.id;
          return (
            <Card
              key={provider.id}
              className={`cursor-pointer transition-all ${
                isSelected
                  ? "border-rose-500 bg-rose-50"
                  : "hover:border-gray-300"
              }`}
              onClick={() => onSelect(provider)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={provider.imageUrl} />
                    <AvatarFallback className="bg-rose-100 text-rose-600">
                      {getInitials(provider.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{provider.name}</h4>
                      {isSelected && <Check className="h-4 w-4 text-rose-600" />}
                    </div>
                    {provider.title && (
                      <p className="text-sm text-muted-foreground">
                        {provider.title}
                      </p>
                    )}

                    {/* Rating */}
                    {provider.rating && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">
                            {provider.rating}
                          </span>
                        </div>
                        {provider.reviewCount && (
                          <span className="text-xs text-muted-foreground">
                            ({provider.reviewCount} reviews)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Specialties */}
                    {provider.specialties && provider.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {provider.specialties.map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="secondary"
                            className="text-xs"
                          >
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Next Available */}
                  {provider.nextAvailable && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Next available
                      </div>
                      <p className="text-sm font-medium text-green-600">
                        {provider.nextAvailable}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  );
}
