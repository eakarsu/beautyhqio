"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Gift,
  Percent,
  User,
} from "lucide-react";
import { formatCurrency, getInitials } from "@/lib/utils";

interface Service {
  id: string;
  name: string;
  price: number;
  category: { name: string } | string;
}

interface Product {
  id: string;
  name: string;
  price: string | number;
  retailPrice?: number;
  category?: { name: string } | string;
}

interface Staff {
  id: string;
  displayName?: string;
  color?: string;
  user?: { firstName: string; lastName: string };
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "service" | "product";
  staffId?: string;
}

const STAFF_COLORS = ["#F43F5E", "#8B5CF6", "#EC4899", "#3B82F6", "#10B981", "#F59E0B", "#6366F1"];

export default function POSPage() {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipPercent, setTipPercent] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, productsRes, staffRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/products"),
          fetch("/api/staff"),
        ]);

        if (servicesRes.ok) {
          const servicesData = await servicesRes.json();
          setServices(servicesData);
        }
        if (productsRes.ok) {
          const productsData = await productsRes.json();
          setProducts(productsData);
        }
        if (staffRes.ok) {
          const staffData = await staffRes.json();
          setStaff(staffData);
          if (staffData.length > 0) {
            setSelectedStaff(staffData[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching POS data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  const addToCart = (
    item: { id: string; name: string; price: number },
    type: "service" | "product"
  ) => {
    const existingItem = cart.find((c) => c.id === item.id && c.type === type);
    if (existingItem) {
      setCart(
        cart.map((c) =>
          c.id === item.id && c.type === type
            ? { ...c, quantity: c.quantity + 1 }
            : c
        )
      );
    } else {
      setCart([
        ...cart,
        {
          ...item,
          quantity: 1,
          type,
          staffId: type === "service" ? selectedStaff : undefined,
        },
      ]);
    }
  };

  const removeFromCart = (id: string, type: "service" | "product") => {
    setCart(cart.filter((c) => !(c.id === id && c.type === type)));
  };

  const updateQuantity = (
    id: string,
    type: "service" | "product",
    delta: number
  ) => {
    setCart(
      cart
        .map((c) =>
          c.id === id && c.type === type
            ? { ...c, quantity: Math.max(0, c.quantity + delta) }
            : c
        )
        .filter((c) => c.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.0875;
  const total = subtotal - discount + tax + tipAmount;

  const handleTipPercent = (percent: string) => {
    setTipPercent(percent);
    if (percent) {
      setTipAmount(subtotal * (parseInt(percent) / 100));
    }
  };

  const getServiceCategory = (service: Service): string => {
    if (typeof service.category === "string") return service.category;
    return service.category?.name || "Uncategorized";
  };

  const getProductCategory = (product: Product): string => {
    if (!product.category) return "Uncategorized";
    if (typeof product.category === "string") return product.category;
    return product.category?.name || "Uncategorized";
  };

  const getStaffName = (s: Staff): string => {
    if (s.displayName) return s.displayName;
    if (s.user) return `${s.user.firstName} ${s.user.lastName.charAt(0)}.`;
    return "Unknown";
  };

  const getStaffColor = (index: number): string => {
    return STAFF_COLORS[index % STAFF_COLORS.length];
  };

  const filteredServices = services.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-140px)] flex gap-6">
      {/* Left Panel - Items */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Point of Sale</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant={activeTab === "services" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("services")}
                >
                  Services
                </Button>
                <Button
                  variant={activeTab === "products" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveTab("products")}
                >
                  Products
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={selectedStaff} onValueChange={setSelectedStaff}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Staff" />
                </SelectTrigger>
                <SelectContent>
                  {staff.map((s, idx) => (
                    <SelectItem key={s.id} value={s.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: s.color || getStaffColor(idx) }}
                        />
                        {getStaffName(s)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-slate-500">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {activeTab === "services"
                  ? filteredServices.map((service) => (
                      <button
                        key={service.id}
                        onClick={() => addToCart({ id: service.id, name: service.name, price: service.price || 0 }, "service")}
                        className="p-4 rounded-lg border hover:border-rose-300 hover:bg-rose-50 transition-colors text-left"
                      >
                        <p className="font-medium text-sm">{service.name}</p>
                        <p className="text-xs text-slate-500">{getServiceCategory(service)}</p>
                        <p className="text-rose-600 font-semibold mt-1">
                          {formatCurrency(service.price || 0)}
                        </p>
                      </button>
                    ))
                  : filteredProducts.map((product) => {
                      const productPrice = parseFloat(String(product.price)) || 0;
                      return (
                        <button
                          key={product.id}
                          onClick={() => addToCart({ id: product.id, name: product.name, price: productPrice }, "product")}
                          className="p-4 rounded-lg border hover:border-rose-300 hover:bg-rose-50 transition-colors text-left"
                        >
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-slate-500">{getProductCategory(product)}</p>
                          <p className="text-rose-600 font-semibold mt-1">
                            {formatCurrency(productPrice)}
                          </p>
                        </button>
                      );
                    })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right Panel - Cart */}
      <Card className="w-[400px] flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Cart</CardTitle>
            {selectedClient ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">SJ</AvatarFallback>
                </Avatar>
                <span className="text-sm">Sarah Johnson</span>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => router.push("/clients?select=true")}>
                <User className="h-4 w-4 mr-1" />
                Add Client
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto space-y-2 mb-4">
            {cart.length === 0 ? (
              <div className="text-center text-slate-400 py-8">
                <p>Cart is empty</p>
                <p className="text-sm">Add services or products</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-slate-50"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      {item.staffId && (
                        <span>
                          {getStaffName(staff.find((s) => s.id === item.staffId) || { id: "", displayName: "Unknown" })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.type, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">
                        {item.quantity}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => updateQuantity(item.id, item.type, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="w-16 text-right font-medium text-sm">
                      {formatCurrency((item.price || 0) * item.quantity)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-red-500"
                      onClick={() => removeFromCart(item.id, item.type)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tip Selection */}
          <div className="border-t pt-3 mb-3">
            <p className="text-sm font-medium mb-2">Tip</p>
            <div className="flex gap-2">
              {["15", "18", "20", "25"].map((percent) => (
                <Button
                  key={percent}
                  variant={tipPercent === percent ? "default" : "outline"}
                  size="sm"
                  className="flex-1"
                  onClick={() => handleTipPercent(percent)}
                >
                  {percent}%
                </Button>
              ))}
              <Input
                placeholder="$"
                className="w-20"
                type="number"
                value={tipAmount > 0 && !tipPercent ? tipAmount : ""}
                onChange={(e) => {
                  setTipPercent("");
                  setTipAmount(parseFloat(e.target.value) || 0);
                }}
              />
            </div>
          </div>

          {/* Totals */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Tax (8.75%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            {tipAmount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Tip</span>
                <span>{formatCurrency(tipAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => {
              const discountInput = prompt("Enter discount amount ($):", "10");
              if (discountInput) setDiscount(parseFloat(discountInput) || 0);
            }}>
              <Percent className="h-4 w-4 mr-1" />
              Discount
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => router.push("/gift-cards/check-balance")}>
              <Gift className="h-4 w-4 mr-1" />
              Gift Card
            </Button>
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button variant="outline" className="h-12" onClick={() => alert(`Processing cash payment of ${formatCurrency(total)}`)}>
              <Banknote className="h-4 w-4 mr-2" />
              Cash
            </Button>
            <Button className="h-12" onClick={() => alert(`Processing card payment of ${formatCurrency(total)}`)}>
              <CreditCard className="h-4 w-4 mr-2" />
              Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
