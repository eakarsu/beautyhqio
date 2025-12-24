"use client";

import { useState, useRef, useCallback } from "react";
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle } from "lucide-react";

interface StripeCardFormProps {
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#1f2937",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      lineHeight: "24px",
      "::placeholder": {
        color: "#9ca3af",
      },
    },
    invalid: {
      color: "#ef4444",
      iconColor: "#ef4444",
    },
  },
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

  // Refs for programmatic focus on iOS
  const cardNumberRef = useRef<any>(null);
  const cardExpiryRef = useRef<any>(null);
  const cardCvcRef = useRef<any>(null);

  // Focus handler for iOS - helps with iframe touch issues
  const focusElement = useCallback((elementType: 'cardNumber' | 'cardExpiry' | 'cardCvc') => {
    if (!elements) return;
    const element = elements.getElement(
      elementType === 'cardNumber' ? CardNumberElement :
      elementType === 'cardExpiry' ? CardExpiryElement :
      CardCvcElement
    );
    if (element) {
      element.focus();
    }
  }, [elements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    const cardElement = elements.getElement(CardNumberElement);

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
        <span>Your card information is encrypted and secure. We never store your full card number.</span>
      </div>

      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">
          {error}
        </div>
      )}

      {/* Card Number */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <CreditCard className="h-4 w-4" />
          Card Number
        </Label>
        <div
          className="border rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 min-h-[48px] cursor-text"
          style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
          onClick={() => focusElement('cardNumber')}
          onTouchEnd={() => focusElement('cardNumber')}
        >
          <CardNumberElement options={cardElementOptions} />
        </div>
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Expiry Date</Label>
          <div
            className="border rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 min-h-[48px] cursor-text"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            onClick={() => focusElement('cardExpiry')}
            onTouchEnd={() => focusElement('cardExpiry')}
          >
            <CardExpiryElement options={cardElementOptions} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>CVC</Label>
          <div
            className="border rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 min-h-[48px] cursor-text"
            style={{ touchAction: 'manipulation', WebkitTapHighlightColor: 'transparent' }}
            onClick={() => focusElement('cardCvc')}
            onTouchEnd={() => focusElement('cardCvc')}
          >
            <CardCvcElement options={cardElementOptions} />
          </div>
        </div>
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
