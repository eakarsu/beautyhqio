"use client";

import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreditCard, Plus, Trash2, Lock, Shield, CheckCircle, AlertCircle } from "lucide-react";
import StripeCardForm from "@/components/billing/StripeCardForm";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// Card brand icons
function CardBrandIcon({ brand }: { brand: string }) {
  const brandColors: Record<string, string> = {
    visa: "text-blue-600",
    mastercard: "text-orange-500",
    amex: "text-blue-500",
    discover: "text-orange-600",
    default: "text-gray-600",
  };

  return (
    <div className={`p-2 rounded-lg bg-gray-100 ${brandColors[brand] || brandColors.default}`}>
      <CreditCard className="h-6 w-6" />
    </div>
  );
}

export default function BillingPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);

  // Fetch Stripe key at runtime and payment methods
  useEffect(() => {
    async function initialize() {
      try {
        // Fetch Stripe publishable key from API (runtime)
        const configRes = await fetch("/api/config/stripe");
        if (configRes.ok) {
          const { publishableKey } = await configRes.json();
          if (publishableKey) {
            setStripePromise(loadStripe(publishableKey));
          } else {
            setStripeError("Stripe key not configured");
          }
        } else {
          setStripeError("Failed to load Stripe configuration");
        }
      } catch (error) {
        console.error("Error loading Stripe:", error);
        setStripeError("Failed to load Stripe");
      }

      // Fetch payment methods
      try {
        const response = await fetch("/api/stripe/payment-methods");
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, []);

  // Fetch saved payment methods
  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/stripe/payment-methods");
      const data = await response.json();
      setPaymentMethods(data.paymentMethods || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    }
  };

  // Create setup intent for adding new card
  const handleAddCard = async () => {
    try {
      const response = await fetch("/api/stripe/create-setup-intent", {
        method: "POST",
      });
      const data = await response.json();

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowAddCard(true);
      }
    } catch (error) {
      console.error("Error creating setup intent:", error);
    }
  };

  // Handle successful card save
  const handleCardSaved = () => {
    setShowAddCard(false);
    setClientSecret(null);
    fetchPaymentMethods();
  };

  // Delete payment method
  const handleDelete = async () => {
    if (!deleteId) return;

    setDeleting(true);
    try {
      await fetch("/api/stripe/payment-methods", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: deleteId }),
      });
      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== deleteId));
    } catch (error) {
      console.error("Error deleting payment method:", error);
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Billing & Payment Methods</h1>
          <p className="text-muted-foreground">
            Securely manage your payment methods
          </p>
        </div>
        {!showAddCard && (
          <Button onClick={handleAddCard} className="bg-rose-600 hover:bg-rose-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Payment Method
          </Button>
        )}
      </div>

      {/* Security Notice */}
      <Card className="mb-6 border-green-200 bg-green-50">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="p-3 bg-green-100 rounded-full">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="font-medium text-green-900">Your payment info is secure</h3>
            <p className="text-sm text-green-700">
              We use Stripe for secure payment processing. Your card details are encrypted and never stored on our servers.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stripe Error */}
      {stripeError && (
        <Card className="mb-6 border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="font-medium text-red-900">Stripe Configuration Error</h3>
              <p className="text-sm text-red-700">{stripeError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Card Form */}
      {showAddCard && clientSecret && stripePromise && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Add New Card
            </CardTitle>
            <CardDescription>
              Enter your card details below. Your information is secure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "stripe",
                  variables: {
                    colorPrimary: "#e11d48",
                  },
                },
              }}
            >
              <StripeCardForm
                clientSecret={clientSecret}
                onSuccess={handleCardSaved}
                onCancel={() => {
                  setShowAddCard(false);
                  setClientSecret(null);
                }}
              />
            </Elements>
          </CardContent>
        </Card>
      )}

      {/* Saved Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Saved Payment Methods
          </CardTitle>
          <CardDescription>
            Your securely saved cards for quick checkout
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">No payment methods</h3>
              <p className="text-gray-500 mt-1">
                Add a card to enable quick and easy payments
              </p>
              <Button
                onClick={handleAddCard}
                className="mt-4 bg-rose-600 hover:bg-rose-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Card
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <CardBrandIcon brand={method.brand} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium capitalize">
                          {method.brand}
                        </span>
                        <span className="text-gray-500">
                          ending in {method.last4}
                        </span>
                        {method.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        Expires {method.expMonth}/{method.expYear}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setDeleteId(method.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* What We Store Info */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4" />
            What we store
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-green-600 flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4" />
                We store:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>- Card brand (Visa, Mastercard, etc.)</li>
                <li>- Last 4 digits (for display only)</li>
                <li>- Expiration date</li>
                <li>- A secure token from Stripe</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-red-600 flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" />
                We NEVER store:
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>- Full card number</li>
                <li>- CVV/Security code</li>
                <li>- PIN</li>
                <li>- Any sensitive card data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Payment Method</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? "Removing..." : "Remove Card"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
