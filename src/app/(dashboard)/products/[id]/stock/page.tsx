"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Package, Plus, Minus } from "lucide-react";

interface Product {
  id: string;
  name: string;
  quantityOnHand: number;
}

export default function AdjustStockPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [formData, setFormData] = useState({
    adjustmentType: "add",
    quantity: 1,
    reason: "",
    notes: "",
  });

  useEffect(() => {
    fetchProduct();
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsLoading(true);

    const newQuantity = formData.adjustmentType === "add"
      ? product.quantityOnHand + formData.quantity
      : Math.max(0, product.quantityOnHand - formData.quantity);

    try {
      const response = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantityOnHand: newQuantity,
        }),
      });

      if (response.ok) {
        router.push(`/products/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to adjust stock");
      }
    } catch (error) {
      console.error("Error adjusting stock:", error);
      alert("Failed to adjust stock");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="p-6">
        <div className="text-center py-8 text-slate-500">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => router.push("/products")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold">Product Not Found</h1>
        </div>
      </div>
    );
  }

  const newQuantity = formData.adjustmentType === "add"
    ? product.quantityOnHand + formData.quantity
    : Math.max(0, product.quantityOnHand - formData.quantity);

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Adjust Stock</h1>
          <p className="text-muted-foreground">{product.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Stock Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-slate-50 rounded-lg text-center">
              <p className="text-sm text-slate-500 mb-1">Current Stock</p>
              <p className="text-3xl font-bold">{product.quantityOnHand}</p>
            </div>

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <Select
                value={formData.adjustmentType}
                onValueChange={(value) => setFormData({ ...formData, adjustmentType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4 text-green-600" />
                      Add Stock
                    </div>
                  </SelectItem>
                  <SelectItem value="remove">
                    <div className="flex items-center gap-2">
                      <Minus className="h-4 w-4 text-red-600" />
                      Remove Stock
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Select
                value={formData.reason}
                onValueChange={(value) => setFormData({ ...formData, reason: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {formData.adjustmentType === "add" ? (
                    <>
                      <SelectItem value="received">Received from Supplier</SelectItem>
                      <SelectItem value="return">Customer Return</SelectItem>
                      <SelectItem value="found">Inventory Correction</SelectItem>
                      <SelectItem value="transfer_in">Transfer In</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="sold">Sold</SelectItem>
                      <SelectItem value="damaged">Damaged</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="theft">Theft/Loss</SelectItem>
                      <SelectItem value="transfer_out">Transfer Out</SelectItem>
                      <SelectItem value="correction">Inventory Correction</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes about this adjustment"
                rows={2}
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">New Stock Level:</span>
                <span className={`text-2xl font-bold ${formData.adjustmentType === "add" ? "text-green-600" : "text-red-600"}`}>
                  {newQuantity}
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2 text-sm text-slate-500">
                <span>{product.quantityOnHand}</span>
                <span>{formData.adjustmentType === "add" ? "+" : "-"}</span>
                <span>{formData.quantity}</span>
                <span>=</span>
                <span className="font-medium text-slate-700">{newQuantity}</span>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-rose-600 hover:bg-rose-700"
                disabled={isLoading || formData.quantity <= 0}
              >
                {isLoading ? "Saving..." : "Adjust Stock"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
