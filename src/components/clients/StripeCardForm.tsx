"use client";

import { useState, useEffect } from "react";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, AlertCircle, Lock } from "lucide-react";

interface CardFormProps {
  clientId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function PaymentFormContent({ onSuccess, onCancel }: Omit<CardFormProps, 'clientId'>) {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        throw new Error(submitError.message || "Validation failed");
      }

      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        throw new Error(confirmError.message || "Card setup failed");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="min-h-[200px]">
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading}>
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Save Card
            </>
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        Secured by Stripe
      </div>
    </form>
  );
}

export default function StripeCardForm({ clientId, onSuccess, onCancel }: CardFormProps) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Stripe key and setup intent when component mounts
  useEffect(() => {
    async function initialize() {
      try {
        // Step 1: Get Stripe publishable key from API (runtime)
        const configRes = await fetch("/api/config/stripe");
        if (!configRes.ok) {
          throw new Error("Failed to load Stripe configuration");
        }
        const { publishableKey } = await configRes.json();

        if (!publishableKey) {
          throw new Error("Stripe publishable key not configured");
        }

        // Initialize Stripe with runtime key
        const stripe = loadStripe(publishableKey);
        setStripePromise(stripe);

        // Step 2: Create setup intent
        const setupRes = await fetch(`/api/clients/${clientId}/setup-intent`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        });

        if (!setupRes.ok) {
          const data = await setupRes.json();
          throw new Error(data.error || "Failed to create setup intent");
        }

        const { clientSecret } = await setupRes.json();
        setClientSecret(clientSecret);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to initialize payment form");
      } finally {
        setLoading(false);
      }
    }

    initialize();
  }, [clientId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">Error</span>
        </div>
        <p className="mt-2 text-sm text-red-600">{error}</p>
        <Button variant="outline" onClick={onCancel} className="mt-4">
          Cancel
        </Button>
      </div>
    );
  }

  if (!stripePromise || !clientSecret) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-700">Initializing payment form...</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#e11d48",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          },
        },
      }}
    >
      <PaymentFormContent onSuccess={onSuccess} onCancel={onCancel} />
    </Elements>
  );
}
