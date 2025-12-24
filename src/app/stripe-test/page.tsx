"use client";

import { useState, useEffect } from "react";
import { loadStripe, Stripe } from "@stripe/stripe-js";
import { Elements, CardElement } from "@stripe/react-stripe-js";

export default function StripeTestPage() {
  const [nativeInputValue, setNativeInputValue] = useState("");
  const [stripeLoaded, setStripeLoaded] = useState<boolean | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [publishableKey, setPublishableKey] = useState<string | null>(null);

  useEffect(() => {
    async function initStripe() {
      try {
        // Fetch key from API (runtime)
        const res = await fetch("/api/config/stripe");
        if (!res.ok) {
          setStripeError("Failed to fetch Stripe config from API");
          setStripeLoaded(false);
          return;
        }

        const data = await res.json();
        if (!data.publishableKey) {
          setStripeError("Stripe publishable key not configured on server");
          setStripeLoaded(false);
          return;
        }

        setPublishableKey(data.publishableKey);

        const stripe = await loadStripe(data.publishableKey);
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

      {/* Test 1: API Fetch */}
      <div className="p-4 border rounded-lg space-y-2">
        <h2 className="font-semibold">1. Runtime API Key Check</h2>
        <p className="text-sm text-gray-600">Fetching Stripe key from /api/config/stripe...</p>
        <div className={`p-3 rounded ${publishableKey ? "bg-green-100 text-green-800" : stripeError ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
          {publishableKey ? (
            <>
              <p className="font-medium">✓ Key fetched from API</p>
              <p className="text-sm font-mono">Starts with: {publishableKey.substring(0, 12)}...</p>
            </>
          ) : stripeError ? (
            <>
              <p className="font-medium">✗ Failed to get key</p>
              <p className="text-sm">{stripeError}</p>
            </>
          ) : (
            <p>Loading...</p>
          )}
        </div>
      </div>

      {/* Test 2: Native Input */}
      <div className="p-4 border rounded-lg space-y-2">
        <h2 className="font-semibold">2. Native HTML Input Test</h2>
        <p className="text-sm text-gray-600">Can you type in this field?</p>
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
          <p className="text-sm text-gray-600">Tap on the card field below:</p>
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
          <p className="text-sm text-gray-500">Test card: 4242 4242 4242 4242</p>
        </div>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
        <p className="font-semibold text-blue-800">What to check:</p>
        <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
          <li>#1 red = Check env-file has STRIPE_PUBLISHABLE_KEY</li>
          <li>#2 not working = General mobile issue</li>
          <li>#3 red = Network/loading error</li>
          <li>#4 not responding = Stripe iframe issue</li>
        </ul>
      </div>
    </div>
  );
}
