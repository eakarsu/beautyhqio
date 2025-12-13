"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Trash2,
  Plus,
  Minus,
  Percent,
  Tag,
  User,
  Clock,
  DollarSign,
} from "lucide-react";
import { TipSelector } from "./TipSelector";

interface LineItem {
  id: string;
  type: "service" | "product";
  name: string;
  price: number;
  quantity: number;
  duration?: number;
  staffId?: string;
  staffName?: string;
  discount?: {
    type: "percent" | "fixed";
    value: number;
  };
}

interface CheckoutPanelProps {
  items: LineItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onApplyDiscount: (itemId: string, discount: { type: "percent" | "fixed"; value: number }) => void;
  onApplyPromoCode: (code: string) => Promise<{ valid: boolean; discount?: number }>;
  onTipChange: (tip: number) => void;
  onCheckout: () => void;
  tip?: number;
  promoCode?: string;
  promoDiscount?: number;
  taxRate?: number;
  client?: {
    id: string;
    firstName: string;
    lastName: string;
    loyaltyPoints?: number;
  } | null;
}

export function CheckoutPanel({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onApplyPromoCode,
  onTipChange,
  onCheckout,
  tip = 0,
  promoCode,
  promoDiscount = 0,
  taxRate = 0.08,
  client,
}: CheckoutPanelProps) {
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<string | null>(null);
  const [discountValue, setDiscountValue] = useState("");
  const [discountType, setDiscountType] = useState<"percent" | "fixed">("percent");

  const calculateItemTotal = (item: LineItem) => {
    let total = item.price * item.quantity;
    if (item.discount) {
      if (item.discount.type === "percent") {
        total -= total * (item.discount.value / 100);
      } else {
        total -= item.discount.value;
      }
    }
    return Math.max(0, total);
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const discountAmount = promoDiscount;
  const afterDiscount = subtotal - discountAmount;
  const tax = afterDiscount * taxRate;
  const total = afterDiscount + tax + tip;

  const totalDuration = items
    .filter((item) => item.type === "service")
    .reduce((sum, item) => sum + (item.duration || 0) * item.quantity, 0);

  const handleApplyPromo = async () => {
    if (!promoInput) return;

    setPromoLoading(true);
    setPromoError("");

    try {
      const result = await onApplyPromoCode(promoInput);
      if (!result.valid) {
        setPromoError("Invalid promo code");
      } else {
        setPromoInput("");
      }
    } catch {
      setPromoError("Error applying promo code");
    } finally {
      setPromoLoading(false);
    }
  };

  const handleApplyItemDiscount = (itemId: string) => {
    if (!discountValue) return;

    onApplyDiscount(itemId, {
      type: discountType,
      value: parseFloat(discountValue),
    });
    setEditingDiscount(null);
    setDiscountValue("");
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Checkout</CardTitle>
          {items.length > 0 && (
            <Badge variant="secondary">{items.length} items</Badge>
          )}
        </div>

        {/* Client Info */}
        {client && (
          <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{client.firstName} {client.lastName}</span>
            {client.loyaltyPoints && client.loyaltyPoints > 0 && (
              <Badge variant="outline" className="ml-auto">
                {client.loyaltyPoints} pts
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4">
          {items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Tag className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No items added</p>
              <p className="text-sm">Select services or products to begin</p>
            </div>
          ) : (
            <div className="space-y-3 pb-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="border rounded-lg p-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge variant={item.type === "service" ? "default" : "secondary"} className="text-xs">
                          {item.type}
                        </Badge>
                        <p className="font-medium truncate">{item.name}</p>
                      </div>

                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>${Number(item.price).toFixed(2)}</span>
                        {item.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {item.duration}min
                          </span>
                        )}
                        {item.staffName && (
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {item.staffName}
                          </span>
                        )}
                      </div>

                      {item.discount && (
                        <Badge variant="outline" className="mt-1 text-green-600">
                          -{item.discount.type === "percent" ? `${item.discount.value}%` : `$${item.discount.value}`}
                        </Badge>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <p className="font-semibold">${calculateItemTotal(item).toFixed(2)}</p>

                      <div className="flex items-center gap-1">
                        {item.type === "product" && (
                          <>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Item Discount */}
                  {editingDiscount === item.id ? (
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                      <Button
                        size="sm"
                        variant={discountType === "percent" ? "default" : "outline"}
                        onClick={() => setDiscountType("percent")}
                      >
                        <Percent className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant={discountType === "fixed" ? "default" : "outline"}
                        onClick={() => setDiscountType("fixed")}
                      >
                        <DollarSign className="h-3 w-3" />
                      </Button>
                      <Input
                        type="number"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                        placeholder={discountType === "percent" ? "%" : "$"}
                        className="w-20 h-8"
                      />
                      <Button size="sm" onClick={() => handleApplyItemDiscount(item.id)}>
                        Apply
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingDiscount(null)}>
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-xs"
                      onClick={() => setEditingDiscount(item.id)}
                    >
                      <Tag className="h-3 w-3 mr-1" />
                      Add Discount
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      {items.length > 0 && (
        <CardFooter className="flex-col p-4 border-t">
          {/* Promo Code */}
          <div className="w-full mb-4">
            <div className="flex gap-2">
              <Input
                placeholder="Promo code"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button
                variant="outline"
                onClick={handleApplyPromo}
                disabled={promoLoading || !promoInput}
              >
                Apply
              </Button>
            </div>
            {promoError && (
              <p className="text-sm text-destructive mt-1">{promoError}</p>
            )}
            {promoCode && (
              <Badge variant="secondary" className="mt-2">
                {promoCode} applied
              </Badge>
            )}
          </div>

          {/* Tip Selector */}
          <div className="w-full mb-4">
            <TipSelector
              subtotal={afterDiscount}
              onTipChange={onTipChange}
              selectedTip={tip}
            />
          </div>

          <Separator className="mb-4" />

          {/* Totals */}
          <div className="w-full space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>

            {discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax ({(taxRate * 100).toFixed(0)}%)</span>
              <span>${tax.toFixed(2)}</span>
            </div>

            {tip > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tip</span>
                <span>${tip.toFixed(2)}</span>
              </div>
            )}

            {totalDuration > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Total Duration
                </span>
                <span>{totalDuration} min</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
          </div>

          <Button className="w-full mt-4 h-12 text-lg" onClick={onCheckout}>
            Proceed to Payment
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
