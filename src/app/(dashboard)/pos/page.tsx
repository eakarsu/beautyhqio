"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  X,
  Check,
  Loader2,
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

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
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
  const searchParams = useSearchParams();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [tipPercent, setTipPercent] = useState<string>("");
  const [discount, setDiscount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"services" | "products">("services");

  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [showClientSelect, setShowClientSelect] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showGiftCardModal, setShowGiftCardModal] = useState(false);
  const [showCashModal, setShowCashModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState("");

  // Discount state
  const [discountType, setDiscountType] = useState<"amount" | "percent">("amount");
  const [discountValue, setDiscountValue] = useState("");

  // Gift card state
  const [giftCardCode, setGiftCardCode] = useState("");
  const [giftCardBalance, setGiftCardBalance] = useState<number | null>(null);
  const [giftCardAmount, setGiftCardAmount] = useState("");
  const [giftCardError, setGiftCardError] = useState("");
  const [giftCardApplied, setGiftCardApplied] = useState<number>(0);

  // Cash payment state
  const [cashReceived, setCashReceived] = useState("");

  // Processing states
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Client payment methods
  const [clientPaymentMethods, setClientPaymentMethods] = useState<any[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("");
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [servicesRes, productsRes, staffRes, clientsRes] = await Promise.all([
          fetch("/api/services"),
          fetch("/api/products"),
          fetch("/api/staff"),
          fetch("/api/clients"),
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
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || clientsData);
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

  const filteredClients = clients.filter((c) =>
    `${c.firstName} ${c.lastName}`.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.email?.toLowerCase().includes(clientSearchQuery.toLowerCase()) ||
    c.phone?.includes(clientSearchQuery)
  );

  // Fetch client payment methods when client is selected
  useEffect(() => {
    if (selectedClient) {
      fetchClientPaymentMethods(selectedClient.id);
    } else {
      setClientPaymentMethods([]);
      setSelectedPaymentMethod("");
    }
  }, [selectedClient]);

  const fetchClientPaymentMethods = async (clientId: string) => {
    setLoadingPaymentMethods(true);
    try {
      const res = await fetch(`/api/clients/${clientId}/payment-methods`);
      if (res.ok) {
        const data = await res.json();
        setClientPaymentMethods(data.paymentMethods || []);
        if (data.paymentMethods?.length > 0) {
          setSelectedPaymentMethod(data.paymentMethods[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoadingPaymentMethods(false);
    }
  };

  // Apply discount
  const applyDiscount = () => {
    const value = parseFloat(discountValue);
    if (isNaN(value) || value <= 0) return;

    if (discountType === "percent") {
      setDiscount(subtotal * (value / 100));
    } else {
      setDiscount(value);
    }
    setShowDiscountModal(false);
    setDiscountValue("");
  };

  // Check gift card balance
  const checkGiftCard = async () => {
    setGiftCardError("");
    setGiftCardBalance(null);

    try {
      const res = await fetch(`/api/gift-cards/check?code=${giftCardCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data.currentBalance > 0) {
          setGiftCardBalance(data.currentBalance);
        } else {
          setGiftCardError("Gift card has no balance");
        }
      } else {
        setGiftCardError("Gift card not found");
      }
    } catch {
      setGiftCardError("Error checking gift card");
    }
  };

  // Apply gift card
  const applyGiftCard = () => {
    const amount = parseFloat(giftCardAmount);
    if (isNaN(amount) || amount <= 0 || !giftCardBalance) return;

    const maxApply = Math.min(amount, giftCardBalance, total - giftCardApplied);
    setGiftCardApplied(prev => prev + maxApply);
    setShowGiftCardModal(false);
    setGiftCardCode("");
    setGiftCardBalance(null);
    setGiftCardAmount("");
  };

  // Process cash payment
  const processCashPayment = async () => {
    if (!selectedClient) {
      setShowClientSelect(true);
      return;
    }

    const received = parseFloat(cashReceived);
    if (isNaN(received) || received < finalTotal) return;

    setIsProcessing(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: selectedClient.id,
          staffId: selectedStaff,
          subtotal,
          discount,
          tax,
          tip: tipAmount,
          giftCardAmount: giftCardApplied,
          total: finalTotal,
          paymentMethod: "CASH",
          items: cart.map(item => ({
            type: item.type,
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      if (res.ok) {
        setPaymentSuccess(true);
        setTimeout(() => {
          resetTransaction();
        }, 2000);
      }
    } catch (error) {
      console.error("Payment error:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Process card payment with Stripe using saved payment method
  const processCardPayment = async () => {
    if (!selectedClient) {
      setShowClientSelect(true);
      return;
    }

    if (!selectedPaymentMethod) {
      alert("Please select a payment method");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100), // Convert to cents
          clientId: selectedClient.id,
          paymentMethodId: selectedPaymentMethod,
          staffId: selectedStaff,
          metadata: {
            subtotal,
            discount,
            tax,
            tip: tipAmount,
            giftCardAmount: giftCardApplied,
          },
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        // Create transaction record
        await fetch("/api/transactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clientId: selectedClient.id,
            staffId: selectedStaff,
            subtotal,
            discount,
            tax,
            tip: tipAmount,
            giftCardAmount: giftCardApplied,
            total: finalTotal,
            paymentMethod: "CARD",
            stripePaymentIntentId: data.paymentIntentId,
            items: cart.map(item => ({
              type: item.type,
              id: item.id,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
            })),
          }),
        });

        setPaymentSuccess(true);
        setTimeout(() => {
          resetTransaction();
        }, 2000);
      } else {
        alert(data.error || "Payment failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset transaction
  const resetTransaction = () => {
    setCart([]);
    setSelectedClient(null);
    setTipAmount(0);
    setTipPercent("");
    setDiscount(0);
    setGiftCardApplied(0);
    setCashReceived("");
    setPaymentSuccess(false);
    setShowCashModal(false);
    setShowCardModal(false);
  };

  // Calculate final total after gift card
  const finalTotal = Math.max(0, total - giftCardApplied);
  const cashChange = parseFloat(cashReceived) - finalTotal;

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
                  <AvatarFallback className="text-xs bg-rose-100 text-rose-600">
                    {getInitials(selectedClient.firstName, selectedClient.lastName)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{selectedClient.firstName} {selectedClient.lastName}</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setSelectedClient(null)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setShowClientSelect(true)}>
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
                <span className="flex items-center gap-1">
                  Discount
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setDiscount(0)}>
                    <X className="h-3 w-3" />
                  </Button>
                </span>
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
            {giftCardApplied > 0 && (
              <div className="flex justify-between text-sm text-purple-600">
                <span className="flex items-center gap-1">
                  Gift Card
                  <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setGiftCardApplied(0)}>
                    <X className="h-3 w-3" />
                  </Button>
                </span>
                <span>-{formatCurrency(giftCardApplied)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatCurrency(finalTotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowDiscountModal(true)}>
              <Percent className="h-4 w-4 mr-1" />
              Discount
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setShowGiftCardModal(true)}>
              <Gift className="h-4 w-4 mr-1" />
              Gift Card
            </Button>
          </div>

          {/* Payment Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <Button
              variant="outline"
              className="h-12"
              disabled={cart.length === 0}
              onClick={() => {
                if (!selectedClient) {
                  setShowClientSelect(true);
                } else {
                  setShowCashModal(true);
                }
              }}
            >
              <Banknote className="h-4 w-4 mr-2" />
              Cash
            </Button>
            <Button
              className="h-12"
              disabled={cart.length === 0}
              onClick={() => {
                if (!selectedClient) {
                  setShowClientSelect(true);
                } else {
                  setShowCardModal(true);
                }
              }}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Card
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Client Selection Modal */}
      <Dialog open={showClientSelect} onOpenChange={setShowClientSelect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Select Client</DialogTitle>
            <DialogDescription>Choose a client for this transaction</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={clientSearchQuery}
                onChange={(e) => setClientSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {filteredClients.map((client) => (
                <button
                  key={client.id}
                  onClick={() => {
                    setSelectedClient(client);
                    setShowClientSelect(false);
                    setClientSearchQuery("");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-slate-50 text-left"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-rose-100 text-rose-600">
                      {getInitials(client.firstName, client.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{client.firstName} {client.lastName}</p>
                    <p className="text-sm text-slate-500">{client.email || client.phone}</p>
                  </div>
                </button>
              ))}
              {filteredClients.length === 0 && (
                <p className="text-center text-slate-500 py-4">No clients found</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount Modal */}
      <Dialog open={showDiscountModal} onOpenChange={setShowDiscountModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Apply Discount</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={discountType === "amount" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setDiscountType("amount")}
              >
                $ Amount
              </Button>
              <Button
                variant={discountType === "percent" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setDiscountType("percent")}
              >
                % Percent
              </Button>
            </div>
            <div>
              <Label>Discount {discountType === "percent" ? "%" : "$"}</Label>
              <Input
                type="number"
                placeholder={discountType === "percent" ? "Enter percentage" : "Enter amount"}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
              />
            </div>
            {discountType === "percent" && discountValue && (
              <p className="text-sm text-slate-500">
                Discount: {formatCurrency(subtotal * (parseFloat(discountValue) / 100))}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDiscountModal(false)}>Cancel</Button>
            <Button onClick={applyDiscount}>Apply</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gift Card Modal */}
      <Dialog open={showGiftCardModal} onOpenChange={setShowGiftCardModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Redeem Gift Card</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Gift Card Code</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code"
                  value={giftCardCode}
                  onChange={(e) => setGiftCardCode(e.target.value.toUpperCase())}
                />
                <Button variant="outline" onClick={checkGiftCard}>Check</Button>
              </div>
            </div>
            {giftCardError && (
              <p className="text-sm text-red-500">{giftCardError}</p>
            )}
            {giftCardBalance !== null && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">Available Balance: {formatCurrency(giftCardBalance)}</p>
                <div className="mt-2">
                  <Label>Amount to Apply</Label>
                  <Input
                    type="number"
                    placeholder="Enter amount"
                    value={giftCardAmount}
                    onChange={(e) => setGiftCardAmount(e.target.value)}
                    max={Math.min(giftCardBalance, finalTotal)}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowGiftCardModal(false);
              setGiftCardCode("");
              setGiftCardBalance(null);
              setGiftCardError("");
            }}>Cancel</Button>
            <Button onClick={applyGiftCard} disabled={!giftCardBalance || !giftCardAmount}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cash Payment Modal */}
      <Dialog open={showCashModal} onOpenChange={setShowCashModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Cash Payment</DialogTitle>
            <DialogDescription>Total: {formatCurrency(finalTotal)}</DialogDescription>
          </DialogHeader>
          {paymentSuccess ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">Payment Successful!</p>
              {cashChange > 0 && (
                <p className="text-slate-500 mt-2">Change: {formatCurrency(cashChange)}</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Cash Received</Label>
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                />
              </div>
              {parseFloat(cashReceived) >= finalTotal && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">Change: {formatCurrency(parseFloat(cashReceived) - finalTotal)}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {[20, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => setCashReceived(String(amount))}
                  >
                    ${amount}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setCashReceived(String(Math.ceil(finalTotal)))}
              >
                Exact Amount ({formatCurrency(Math.ceil(finalTotal))})
              </Button>
            </div>
          )}
          {!paymentSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCashModal(false)}>Cancel</Button>
              <Button
                onClick={processCashPayment}
                disabled={isProcessing || parseFloat(cashReceived) < finalTotal}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Complete Payment"
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Card Payment Modal */}
      <Dialog open={showCardModal} onOpenChange={setShowCardModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Card Payment</DialogTitle>
            <DialogDescription>Total: {formatCurrency(finalTotal)}</DialogDescription>
          </DialogHeader>
          {paymentSuccess ? (
            <div className="text-center py-8">
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="text-lg font-semibold text-green-600">Payment Successful!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {loadingPaymentMethods ? (
                <div className="text-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-slate-400" />
                  <p className="text-sm text-slate-500 mt-2">Loading payment methods...</p>
                </div>
              ) : clientPaymentMethods.length > 0 ? (
                <div className="space-y-2">
                  <Label>Select Card</Label>
                  {clientPaymentMethods.map((pm) => (
                    <button
                      key={pm.id}
                      onClick={() => setSelectedPaymentMethod(pm.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                        selectedPaymentMethod === pm.id
                          ? "border-rose-500 bg-rose-50"
                          : "hover:bg-slate-50"
                      }`}
                    >
                      <CreditCard className="h-5 w-5 text-slate-400" />
                      <div>
                        <p className="font-medium capitalize">{pm.card?.brand} •••• {pm.card?.last4}</p>
                        <p className="text-sm text-slate-500">Expires {pm.card?.exp_month}/{pm.card?.exp_year}</p>
                      </div>
                      {selectedPaymentMethod === pm.id && (
                        <Check className="h-5 w-5 text-rose-500 ml-auto" />
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 border-2 border-dashed rounded-lg text-center">
                  <CreditCard className="h-12 w-12 mx-auto text-slate-400 mb-3" />
                  <p className="text-slate-600">No saved cards found</p>
                  <p className="text-sm text-slate-400 mt-1">Client needs to add a payment method</p>
                </div>
              )}
            </div>
          )}
          {!paymentSuccess && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCardModal(false)}>Cancel</Button>
              <Button
                onClick={processCardPayment}
                disabled={isProcessing || !selectedPaymentMethod || clientPaymentMethods.length === 0}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Charge {formatCurrency(finalTotal)}
                  </>
                )}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
