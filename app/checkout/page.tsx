
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
<<<<<<< HEAD
import {
  cartItemKey,
  useCart,
} from "../CartContext";

export default function CheckoutPage() {
  const router = useRouter();

=======
import { useCart, cartItemKey } from "../CartContext";
import { useCurrency } from "../CurrencyContext";

export default function CheckoutPage() {
  const router = useRouter();
>>>>>>> e9886a2 (up)
  const {
    cart,
    hydrated,
    updateQuantity,
    removeItem,
  } = useCart();
<<<<<<< HEAD
=======
  const { format } = useCurrency();
>>>>>>> e9886a2 (up)

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

<<<<<<< HEAD
  // Cart prices are display-only.
  // The backend verifies prices before payment.
  // Assumes CartContext prices are in USD.
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (total, item) =>
          total + item.price * item.quantity,
=======
  const subtotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.price * item.quantity,
>>>>>>> e9886a2 (up)
        0
      ),
    [cart]
  );

<<<<<<< HEAD
  const formatMoney = (amount: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

  async function handleCheckout() {
=======
  async function handlePayment() {
>>>>>>> e9886a2 (up)
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

<<<<<<< HEAD
      if (!response.ok) {
=======
      if (!response.ok || !data.url) {
>>>>>>> e9886a2 (up)
        throw new Error(
          data.error || "Unable to start checkout."
        );
      }

<<<<<<< HEAD
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

=======
>>>>>>> e9886a2 (up)
      window.location.assign(data.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
<<<<<<< HEAD
          : "Checkout failed. Please try again."
=======
          : "Something went wrong."
>>>>>>> e9886a2 (up)
      );
      setLoading(false);
    }
  }

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
<<<<<<< HEAD
        Loading checkout...
=======
        <p>Loading checkout...</p>
      </main>
    );
  }

  if (!cart.length) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-white px-5 text-center text-black">
        <h1 className="text-3xl font-bold">
          Your cart is empty
        </h1>
        <p className="text-gray-500">
          Add your favorite zodiac merch to get started.
        </p>
        <button
          onClick={() => router.push("/")}
          className="rounded-xl bg-black px-8 py-4 font-semibold text-white"
        >
          Continue Shopping
        </button>
>>>>>>> e9886a2 (up)
      </main>
    );
  }

  return (
<<<<<<< HEAD
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
=======
    <main className="min-h-screen bg-[#fafafa] text-black">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
          <button
            onClick={() => router.push("/cart")}
            className="text-sm font-medium"
          >
            ← Back to Cart
          </button>

          <span className="text-sm font-bold tracking-tight">
            ZODIAC DATN
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10">
        <div className="mb-9 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
>>>>>>> e9886a2 (up)
            Zodiac DatN Shop
          </p>

          <h1 className="text-4xl font-bold tracking-tight">
            Checkout
          </h1>

          <p className="mt-3 text-sm text-gray-500">
<<<<<<< HEAD
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
=======
            Review your items and complete your order securely.
          </p>
        </div>

        <div className="grid gap-7 lg:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">
                Your Items
              </h2>

              <span className="text-sm text-gray-500">
                {cart.reduce(
                  (sum, item) => sum + item.quantity,
                  0
                )}{" "}
                items
              </span>
            </div>

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

                        <div className="mt-2 space-y-1 text-sm text-gray-500">
                          {item.size && (
                            <p>Size: {item.size}</p>
                          )}
                          {item.color && (
                            <p>Color: {item.color}</p>
                          )}
                        </div>

                        <p className="mt-3 font-semibold">
                          {format(item.price)}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(key)}
                        className="text-xs font-medium text-gray-500 underline"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="mt-4 inline-flex items-center overflow-hidden rounded-lg border border-gray-200">
                      <button
                        onClick={() =>
                          updateQuantity(
                            key,
                            Math.max(1, item.quantity - 1)
                          )
                        }
                        className="px-4 py-2"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <span className="min-w-8 text-center text-sm">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() =>
                          updateQuantity(
                            key,
                            item.quantity + 1
                          )
                        }
                        className="px-4 py-2"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="h-fit rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-6 text-xl font-bold">
              Order Summary
            </h2>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">
                  Estimated subtotal
                </span>
                <span className="font-semibold">
                  {format(subtotal)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Shipping
                </span>
                <span>Calculated at payment</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">
                  Taxes
                </span>
                <span>Calculated at payment</span>
              </div>
            </div>

            <div className="my-6 border-t border-gray-200" />

            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold">
                Estimated subtotal
              </span>
              <span className="text-2xl font-bold">
                {format(subtotal)}
              </span>
            </div>

            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
              >
                {error}
              </p>
>>>>>>> e9886a2 (up)
            )}

            <button
              type="button"
<<<<<<< HEAD
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
=======
              disabled={loading}
              onClick={handlePayment}
              className="w-full rounded-xl bg-black px-5 py-4 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
            >
              {loading
                ? "Preparing Secure Checkout..."
                : "Continue to Secure Payment →"}
            </button>

            <p className="mt-5 text-center text-xs leading-5 text-gray-500">
              Customer information, delivery address,
              shipping charges, and payment are handled
              during secure checkout.
            </p>
          </aside>
        </div>
>>>>>>> e9886a2 (up)
      </div>
    </main>
  );
}
