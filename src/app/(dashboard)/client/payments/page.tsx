"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { CreditCard, Plus, Trash2, Check, Shield, AlertCircle, Receipt, Clock } from "lucide-react";
import StripeCardForm from "@/components/billing/StripeCardForm";

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  date: string;
  description: string;
  last4?: string;
  brand?: string;
}

export default function PaymentMethodsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddCard, setShowAddCard] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"methods" | "history">("methods");

  useEffect(() => {
    if (status === "authenticated" && !session?.user?.isClient) {
      router.push("/dashboard");
      return;
    }
    if (status === "authenticated") {
      initializeStripe();
      fetchPaymentMethods();
      fetchPaymentHistory();
    }
  }, [session, status, router]);

  const initializeStripe = async () => {
    try {
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
  };

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch("/api/client/payment-methods");
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data.paymentMethods || []);
      }
    } catch (error) {
      console.error("Error fetching payment methods:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async () => {
    try {
      const response = await fetch("/api/client/payment-history");
      if (response.ok) {
        const data = await response.json();
        setPaymentHistory(data.payments || []);
      }
    } catch (error) {
      console.error("Error fetching payment history:", error);
    }
  };

  const handleAddCard = async () => {
    try {
      // Use existing client payment-methods endpoint
      const response = await fetch("/api/client/payment-methods", {
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

  const handleCardSaved = () => {
    setShowAddCard(false);
    setClientSecret(null);
    fetchPaymentMethods();
  };

  const handleSetDefault = async (id: string) => {
    try {
      await fetch(`/api/client/payment-methods/${id}/default`, {
        method: "POST",
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error setting default:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this card?")) return;
    try {
      await fetch(`/api/client/payment-methods/${id}`, {
        method: "DELETE",
      });
      fetchPaymentMethods();
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Payments</h1>
          <p className="text-slate-600">Manage payment methods and view history</p>
        </div>
        {activeTab === "methods" && !showAddCard && (
          <button
            onClick={handleAddCard}
            className="flex items-center gap-2 px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Card
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("methods")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "methods"
              ? "text-rose-600 border-b-2 border-rose-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Payment Methods
          </div>
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === "history"
              ? "text-rose-600 border-b-2 border-rose-600"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Payment History
          </div>
        </button>
      </div>

      {activeTab === "methods" && (
        <>
          {/* Security Notice */}
          <div className="max-w-2xl bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">Your payment info is secure</h3>
              <p className="text-sm text-green-700">
                We use Stripe for secure payment processing. Your card details are encrypted and never stored on our servers.
              </p>
            </div>
          </div>
        </>
      )}

      {activeTab === "methods" && stripeError && (
        <div className="max-w-2xl bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-4">
          <AlertCircle className="h-6 w-6 text-red-600" />
          <div>
            <h3 className="font-medium text-red-900">Stripe Configuration Error</h3>
            <p className="text-sm text-red-700">{stripeError}</p>
          </div>
        </div>
      )}

      {/* Add Card Form */}
      {activeTab === "methods" && showAddCard && clientSecret && stripePromise && (
        <div className="max-w-2xl bg-white rounded-xl border p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-slate-600" />
            <h2 className="text-lg font-semibold text-slate-900">Add New Card</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Enter your card details below. Your information is secure.
          </p>
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
        </div>
      )}

      {activeTab === "methods" && (
        <div className="space-y-4 max-w-2xl">
          {paymentMethods.length > 0 ? (
            paymentMethods.map((method) => (
            <div
              key={method.id}
              className={`bg-white rounded-xl border p-4 ${
                method.isDefault ? "border-rose-300 ring-1 ring-rose-100" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 bg-slate-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-slate-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">
                        {method.brand} •••• {method.last4}
                      </p>
                      {method.isDefault && (
                        <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-xs rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">
                      Expires {method.expMonth}/{method.expYear}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Set as default"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove card"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl border p-8 text-center">
            <CreditCard className="h-12 w-12 mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 mb-4">No payment methods saved</p>
            <button
              onClick={handleAddCard}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Add Your First Card
            </button>
          </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {activeTab === "history" && (
        <div className="space-y-4 max-w-2xl">
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-xl border p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                      payment.status === "succeeded" ? "bg-green-100" : "bg-slate-100"
                    }`}>
                      <Receipt className={`h-6 w-6 ${
                        payment.status === "succeeded" ? "text-green-600" : "text-slate-600"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">
                        {payment.description || "Payment"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Clock className="h-3 w-3" />
                        {new Date(payment.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {payment.last4 && (
                          <span className="ml-2">•••• {payment.last4}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">
                      ${(payment.amount / 100).toFixed(2)}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      payment.status === "succeeded"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}>
                      {payment.status === "succeeded" ? "Paid" : payment.status}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-xl border p-8 text-center">
              <Receipt className="h-12 w-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">No payment history yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
