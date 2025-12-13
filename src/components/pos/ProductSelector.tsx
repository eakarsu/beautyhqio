"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Package,
  Plus,
  Minus,
  ShoppingCart,
  Tag,
  Barcode,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  category: string;
  inStock: number;
  imageUrl?: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface ProductSelectorProps {
  onAddToCart: (product: Product, quantity: number) => void;
  cart?: CartItem[];
}

const CATEGORIES = [
  { id: "all", label: "All Products" },
  { id: "haircare", label: "Hair Care" },
  { id: "skincare", label: "Skin Care" },
  { id: "styling", label: "Styling" },
  { id: "tools", label: "Tools" },
  { id: "accessories", label: "Accessories" },
];

export function ProductSelector({ onAddToCart, cart = [] }: ProductSelectorProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/products");
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      // Demo data
      setProducts([
        { id: "p1", name: "Professional Shampoo", sku: "SH001", price: 24.99, category: "haircare", inStock: 45 },
        { id: "p2", name: "Deep Conditioner", sku: "CO001", price: 29.99, category: "haircare", inStock: 32 },
        { id: "p3", name: "Hair Serum", sku: "SE001", price: 34.99, category: "haircare", inStock: 28 },
        { id: "p4", name: "Styling Gel", sku: "ST001", price: 18.99, category: "styling", inStock: 50 },
        { id: "p5", name: "Hairspray Strong Hold", sku: "ST002", price: 22.99, category: "styling", inStock: 38 },
        { id: "p6", name: "Texturizing Spray", sku: "ST003", price: 26.99, category: "styling", inStock: 25 },
        { id: "p7", name: "Face Moisturizer", sku: "SK001", price: 45.99, category: "skincare", inStock: 20 },
        { id: "p8", name: "Facial Cleanser", sku: "SK002", price: 32.99, category: "skincare", inStock: 35 },
        { id: "p9", name: "Hair Dryer Pro", sku: "TL001", price: 149.99, category: "tools", inStock: 8 },
        { id: "p10", name: "Curling Iron", sku: "TL002", price: 89.99, category: "tools", inStock: 12 },
        { id: "p11", name: "Hair Clips Set", sku: "AC001", price: 12.99, category: "accessories", inStock: 100 },
        { id: "p12", name: "Silk Scrunchies", sku: "AC002", price: 15.99, category: "accessories", inStock: 75 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode?.includes(searchQuery);
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getQuantity = (productId: string) => quantities[productId] || 1;

  const updateQuantity = (productId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta),
    }));
  };

  const handleAddToCart = (product: Product) => {
    onAddToCart(product, getQuantity(product.id));
    setQuantities((prev) => ({ ...prev, [product.id]: 1 }));
  };

  const isInCart = (productId: string) => cart.some((item) => item.product.id === productId);

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Products
        </CardTitle>
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <div className="px-4">
            <TabsList className="w-full justify-start overflow-x-auto">
              {CATEGORIES.map((cat) => (
                <TabsTrigger key={cat.id} value={cat.id} className="text-sm">
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value={selectedCategory} className="m-0">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No products found</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`border rounded-lg p-3 hover:border-rose-300 transition-colors ${
                        isInCart(product.id) ? "bg-rose-50 border-rose-300" : ""
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{product.name}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {product.sku && (
                              <span className="flex items-center gap-1">
                                <Tag className="h-3 w-3" />
                                {product.sku}
                              </span>
                            )}
                            {product.barcode && (
                              <span className="flex items-center gap-1">
                                <Barcode className="h-3 w-3" />
                                {product.barcode}
                              </span>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant={product.inStock > 10 ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {product.inStock} in stock
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <span className="text-lg font-bold text-rose-600">
                          ${product.price.toFixed(2)}
                        </span>

                        <div className="flex items-center gap-2">
                          {/* Quantity Controls */}
                          <div className="flex items-center border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, -1)}
                              disabled={getQuantity(product.id) <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">
                              {getQuantity(product.id)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => updateQuantity(product.id, 1)}
                              disabled={getQuantity(product.id) >= product.inStock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Add Button */}
                          <Button
                            size="sm"
                            className="bg-rose-600 hover:bg-rose-700"
                            onClick={() => handleAddToCart(product)}
                            disabled={product.inStock === 0}
                          >
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
