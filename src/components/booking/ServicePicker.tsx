"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Check, Search, Clock, DollarSign } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  category: string;
}

interface ServicePickerProps {
  selectedServices: Service[];
  onSelect: (services: Service[]) => void;
  maxServices?: number;
}

export function ServicePicker({
  selectedServices,
  onSelect,
  maxServices,
}: ServicePickerProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/services");
      if (response.ok) {
        const data = await response.json();
        setServices(data);
        const uniqueCategories = [...new Set(data.map((s: Service) => s.category))];
        setCategories(uniqueCategories as string[]);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      // Demo data
      const demoServices: Service[] = [
        { id: "s1", name: "Haircut", description: "Classic haircut and style", duration: 30, price: 45, category: "Hair" },
        { id: "s2", name: "Haircut & Style", description: "Haircut with blowdry styling", duration: 45, price: 65, category: "Hair" },
        { id: "s3", name: "Hair Color", description: "Single process color", duration: 90, price: 120, category: "Color" },
        { id: "s4", name: "Highlights", description: "Partial or full highlights", duration: 120, price: 180, category: "Color" },
        { id: "s5", name: "Balayage", description: "Hand-painted highlights", duration: 150, price: 250, category: "Color" },
        { id: "s6", name: "Deep Conditioning", description: "Intensive hair treatment", duration: 30, price: 35, category: "Treatment" },
        { id: "s7", name: "Keratin Treatment", description: "Smoothing and frizz control", duration: 120, price: 300, category: "Treatment" },
        { id: "s8", name: "Blowout", description: "Professional blowdry", duration: 30, price: 45, category: "Style" },
        { id: "s9", name: "Updo", description: "Special occasion styling", duration: 60, price: 85, category: "Style" },
        { id: "s10", name: "Men's Cut", description: "Men's haircut", duration: 20, price: 30, category: "Hair" },
      ];
      setServices(demoServices);
      setCategories(["Hair", "Color", "Treatment", "Style"]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleService = (service: Service) => {
    const isSelected = selectedServices.some((s) => s.id === service.id);
    if (isSelected) {
      onSelect(selectedServices.filter((s) => s.id !== service.id));
    } else {
      if (maxServices && selectedServices.length >= maxServices) return;
      onSelect([...selectedServices, service]);
    }
  };

  const isServiceSelected = (serviceId: string) => {
    return selectedServices.some((s) => s.id === serviceId);
  };

  const filteredServices = services.filter((service) => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "all" || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services..."
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="all">All</TabsTrigger>
          {categories.map((category) => (
            <TabsTrigger key={category} value={category}>
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading services...
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No services found
            </div>
          ) : (
            <ScrollArea className="h-[350px] pr-4">
              <div className="space-y-2">
                {filteredServices.map((service) => {
                  const selected = isServiceSelected(service.id);
                  return (
                    <Card
                      key={service.id}
                      className={`cursor-pointer transition-all ${
                        selected
                          ? "border-rose-500 bg-rose-50"
                          : "hover:border-gray-300"
                      }`}
                      onClick={() => toggleService(service)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{service.name}</h4>
                              {selected && (
                                <Check className="h-4 w-4 text-rose-600" />
                              )}
                            </div>
                            {service.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.duration} min
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {service.price.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <Badge variant="secondary">{service.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </TabsContent>
      </Tabs>

      {/* Selected Services Summary */}
      {selectedServices.length > 0 && (
        <div className="bg-rose-50 rounded-lg p-3">
          <h4 className="font-medium text-sm mb-2">Selected Services:</h4>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((service) => (
              <Badge
                key={service.id}
                variant="secondary"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleService(service);
                }}
              >
                {service.name}
                <span className="ml-1 text-xs">×</span>
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
