
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  cartItemKey,
  useCart,
} from "../CartContext";

export default function CheckoutPage() {
  const router = useRouter();

  const {
    cart,
    hydrated,
    updateQuantity,
    removeItem,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cart prices are display-only.
  // The backend verifies prices before payment.
  // Assumes CartContext prices are in USD.
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.price * item.quantity,
        0
      ),
    [cart]
  );

  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  async function handleCheckout() {
    if (!cart.length || loading) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cart.map((item) => ({
            id: item.id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to start checkout."
        );
      }

      if (
        typeof data.url !== "string" ||
        !data.url.startsWith(
          "https://checkout.stripe.com/"
        )
      ) {
        throw new Error(
          "Invalid Stripe checkout URL."
        );
      }

      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Checkout failed. Please try again."
      );
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        Loading checkout...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-5 py-10 text-black">
      <div className="mx-auto max-w-2xl">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="mb-10 text-sm text-gray-500"
        >
          ← Continue Shopping
        </button>

        <header className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
            Zodiac DatN Shop
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Checkout
          </h1>

          <p className="mt-3 text-sm text-gray-500">
            Review your order and pay securely.
          </p>
        </header>

        {cart.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 p-8 text-center">
            <h2 className="text-xl font-semibold">
              Your cart is empty
            </h2>

            <p className="mt-3 text-gray-500">
              Discover something made for your sign.
            </p>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="mt-8 w-full rounded-xl bg-black px-6 py-4 font-semibold text-white"
            >
              Explore the Shop
            </button>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-gray-200 p-5 sm:p-8">
              <h2 className="mb-6 text-xl font-bold">
                Your Order
              </h2>

              <div className="divide-y divide-gray-100">
                {cart.map((item) => {
                  const key = cartItemKey(item);

                  return (
                    <div
                      key={key}
                      className="py-5 first:pt-0"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold leading-snug">
                            {item.name}
                          </h3>

                          {item.size && (
                            <p className="mt-2 text-sm text-gray-500">
                              Size: {item.size}
                            </p>
                          )}

                          {item.color && (
                            <p className="mt-1 text-sm text-gray-500">
                              Color: {item.color}
                            </p>
                          )}

                          <p className="mt-2 text-sm text-gray-500">
                            {formatMoney(item.price)} each
                          </p>
                        </div>

                        <p className="shrink-0 font-semibold">
                          {formatMoney(
                            item.price * item.quantity
                          )}
                        </p>
                      </div>

                      <div className="mt-5 flex items-center justify-between">
                        <div className="flex items-center rounded-xl border border-gray-200">
                          <button
                            type="button"
                            aria-label="Decrease quantity"
                            onClick={() => {
                              if (item.quantity === 1) {
                                removeItem(key);
                              } else {
                                updateQuantity(
                                  key,
                                  item.quantity - 1
                                );
                              }
                            }}
                            className="px-4 py-2 text-lg"
                          >
                            −
                          </button>

                          <span className="min-w-8 text-center text-sm font-semibold">
                            {item.quantity}
                          </span>

                          <button
                            type="button"
                            aria-label="Increase quantity"
                            onClick={() =>
                              updateQuantity(
                                key,
                                item.quantity + 1
                              )
                            }
                            className="px-4 py-2 text-lg"
                          >
                            +
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(key)}
                          className="text-sm text-gray-500 underline"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex justify-between text-sm">
                  <span>Cart subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-gray-500">
                  Final prices, shipping and applicable
                  taxes are confirmed during secure
                  checkout.
                </p>
              </div>
            </section>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
              >
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={handleCheckout}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-black px-6 py-5 text-base font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Connecting to Stripe..."
                : "Continue to Secure Payment →"}
            </button>

            <p className="mt-5 text-center text-xs text-gray-500">
              Secure payment powered by Stripe
            </p>
          </>
        )}
      </div>
    </main>
  );
}
