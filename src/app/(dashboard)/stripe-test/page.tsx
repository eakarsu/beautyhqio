"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement } from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";

// Get the key and log it
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

export default function StripeTestPage() {
  const [nativeInputValue, setNativeInputValue] = useState("");
  const [stripeLoaded, setStripeLoaded] = useState<boolean | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<any>(null);

  useEffect(() => {
    async function initStripe() {
      if (!stripeKey) {
        setStripeError("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is empty or not set");
        setStripeLoaded(false);
        return;
      }

      try {
        const stripe = await loadStripe(stripeKey);
        if (stripe) {
          setStripeInstance(stripe);
          setStripeLoaded(true);
        } else {
          setStripeError("loadStripe returned null");
          setStripeLoaded(false);
        }
      } catch (err) {
        setStripeError(err instanceof Error ? err.message : "Unknown error loading Stripe");
        setStripeLoaded(false);
      }
    }

    initStripe();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Stripe Mobile Input Test</h1>

      {/* Test 1: Environment Variable */}
      <div className="p-4 border rounded-lg space-y-2">
        <h2 className="font-semibold">1. Environment Variable Check</h2>
        <div className={`p-3 rounded ${stripeKey ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
          {stripeKey ? (
            <>
              <p className="font-medium">✓ Key is set</p>
              <p className="text-sm font-mono">Starts with: {stripeKey.substring(0, 12)}...</p>
            </>
          ) : (
            <>
              <p className="font-medium">✗ Key is NOT set</p>
              <p className="text-sm">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is missing. Must be set during Docker BUILD.</p>
            </>
          )}
        </div>
      </div>

      {/* Test 2: Native Input */}
      <div className="p-4 border rounded-lg space-y-2">
        <h2 className="font-semibold">2. Native HTML Input Test</h2>
        <p className="text-sm text-gray-600">Can you type in this field? If not, the issue is general, not Stripe-specific.</p>
        <input
          type="text"
          value={nativeInputValue}
          onChange={(e) => setNativeInputValue(e.target.value)}
          placeholder="Tap here and try typing..."
          className="w-full p-4 border-2 rounded-lg text-lg"
          style={{ fontSize: "18px" }}
        />
        <p className="text-sm">
          You typed: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{nativeInputValue || "(nothing yet)"}</span>
        </p>
      </div>

      {/* Test 3: Stripe Loading */}
      <div className="p-4 border rounded-lg space-y-2">
        <h2 className="font-semibold">3. Stripe.js Loading</h2>
        <div className={`p-3 rounded ${
          stripeLoaded === null ? "bg-yellow-100 text-yellow-800" :
          stripeLoaded ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
        }`}>
          {stripeLoaded === null ? (
            <p>Loading Stripe...</p>
          ) : stripeLoaded ? (
            <p className="font-medium">✓ Stripe loaded successfully</p>
          ) : (
            <>
              <p className="font-medium">✗ Stripe failed to load</p>
              <p className="text-sm">{stripeError}</p>
            </>
          )}
        </div>
      </div>

      {/* Test 4: Card Element */}
      {stripeInstance && (
        <div className="p-4 border rounded-lg space-y-2">
          <h2 className="font-semibold">4. Stripe Card Element</h2>
          <p className="text-sm text-gray-600">Tap on the card field below and try to enter card details:</p>
          <Elements stripe={stripeInstance}>
            <div
              className="p-4 border-2 rounded-lg bg-white"
              style={{ minHeight: "60px" }}
            >
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: "18px",
                      lineHeight: "28px",
                    },
                  },
                }}
              />
            </div>
          </Elements>
          <p className="text-sm text-gray-500">Test card: 4242 4242 4242 4242, any future date, any CVC</p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h2 className="font-semibold text-blue-800">What to check:</h2>
        <ol className="list-decimal list-inside text-sm text-blue-700 space-y-1 mt-2">
          <li>If #1 shows key is NOT set → Rebuild Docker with build args</li>
          <li>If #2 native input doesn&apos;t work → General mobile issue, not Stripe</li>
          <li>If #3 shows Stripe failed → Check network/console for errors</li>
          <li>If #4 card element doesn&apos;t respond → Specific Stripe iframe issue</li>
        </ol>
      </div>
    </div>
  );
}
