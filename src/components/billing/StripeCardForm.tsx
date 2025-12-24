"use client";

import { useState } from "react";
import {
  useStripe,
  useElements,
  CardElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle } from "lucide-react";

interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Use single CardElement - better iOS Safari support than split elements
const cardElementOptions = {
  style: {
    base: {
      fontSize: "18px",
      color: "#1f2937",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      lineHeight: "28px",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
  hidePostalCode: true,
};

export default function StripeCardForm({
  clientSecret,
  onSuccess,
  onCancel,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardElement);

    if (!cardElement) {
      setError("Card element not found");
      setLoading(false);
      return;
    }

    try {
      const { error: setupError, setupIntent } = await stripe.confirmCardSetup(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (setupError) {
        setError(setupError.message || "Failed to save card");
      } else if (setupIntent?.status === "succeeded") {
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Card Saved Successfully</h3>
        <p className="text-gray-500 mt-1">Your payment method has been securely saved.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Security Badge */}
      <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 p-3 rounded-lg">
        <Lock className="h-4 w-4" />
        <span>Your card information is encrypted and secure.</span>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Single Card Element - better iOS support */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Card Details
        </Label>
        <div
          className="border-2 rounded-lg p-4 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500"
          style={{
            minHeight: '56px',
            touchAction: 'auto',
            WebkitUserSelect: 'text',
            userSelect: 'text',
          }}
        >
          <CardElement options={cardElementOptions} />
        </div>
        <p className="text-xs text-gray-500">
          Enter your card number, expiry date, and CVC
        </p>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="flex-1 bg-rose-600 hover:bg-rose-700"
          disabled={!stripe || loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </span>
          ) : (
            "Save Card"
          )}
        </Button>
      </div>

      {/* Trust Badge */}
      <div className="flex items-center justify-center gap-2 pt-4 border-t text-xs text-gray-400">
        <Lock className="h-3 w-3" />
        Secured by Stripe
      </div>
    </form>
  );
}
