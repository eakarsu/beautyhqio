"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Clock, DollarSign } from "lucide-react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
  category?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  sku?: string;
  category?: string;
  stock?: number;
}

interface ServiceSelectorProps {
  services: Service[];
  products: Product[];
  onAddService: (service: Service) => void;
  onAddProduct: (product: Product) => void;
}

export function ServiceSelector({
  services,
  products,
  onAddService,
  onAddProduct,
}: ServiceSelectorProps) {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("services");

  const serviceCategories = [...new Set(services.map((s) => s.category || "Other"))];
  const productCategories = [...new Set(products.map((p) => p.category || "Other"))];

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  const groupedServices = serviceCategories.reduce((acc, category) => {
    acc[category] = filteredServices.filter((s) => (s.category || "Other") === category);
    return acc;
  }, {} as Record<string, Service[]>);

  const groupedProducts = productCategories.reduce((acc, category) => {
    acc[category] = filteredProducts.filter((p) => (p.category || "Other") === category);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Add Items</CardTitle>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search services or products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-4">
            <TabsTrigger value="services" className="flex-1">
              Services
            </TabsTrigger>
            <TabsTrigger value="products" className="flex-1">
              Products
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full px-4 pb-4">
              {Object.entries(groupedServices).map(([category, categoryServices]) => (
                categoryServices.length > 0 && (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryServices.map((service) => (
                        <div
                          key={service.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => onAddService(service)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{service.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {service.duration}min
                              </span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {Number(service.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              {filteredServices.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No services found</p>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="products" className="flex-1 overflow-hidden m-0">
            <ScrollArea className="h-full px-4 pb-4">
              {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
                categoryProducts.length > 0 && (
                  <div key={category} className="mb-4">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      {category}
                    </h4>
                    <div className="space-y-2">
                      {categoryProducts.map((product) => (
                        <div
                          key={product.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => onAddProduct(product)}
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{product.name}</p>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              {product.sku && <span>SKU: {product.sku}</span>}
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                {Number(product.price).toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {product.stock !== undefined && (
                              <Badge variant={product.stock > 0 ? "secondary" : "destructive"}>
                                {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                              </Badge>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 shrink-0"
                              disabled={product.stock === 0}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-center text-muted-foreground py-8">No products found</p>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
