
"use client";

import { useRouter } from "next/navigation";
import {
  useCart,
  cartItemKey,
} from "../CartContext";
import { useCurrency } from "../CurrencyContext";

export default function CartPage(): React.ReactElement {
  const router = useRouter();

  const {
    cart,
    updateQuantity,
    removeItem,
    clearCart,
    cartCount,
    hydrated,
  } = useCart();

  const { format } = useCurrency();

  const subtotalUSD = cart.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  function handleCheckout() {
    if (cart.length === 0) return;

    router.push("/checkout");
  }

  /* =====================================================
     LOADING SAVED CART
  ===================================================== */

  if (!hydrated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        <p className="text-sm text-gray-500">
          Loading your cart...
        </p>
      </main>
    );
  }

  /* =====================================================
     EMPTY CART
  ===================================================== */

  if (cart.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-5 text-center text-black">
        <h1 className="mb-3 text-2xl font-bold">
          Your cart is empty
        </h1>

        <p className="mb-6 max-w-sm text-sm text-gray-600">
          Discover zodiac inspired fashion and accessories
          made for your sign, energy, and style.
        </p>

        <button
          type="button"
          onClick={() => router.push("/")}
          className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
        >
          Shop Zodiac Merch
        </button>
      </main>
    );
  }

  /* =====================================================
     CART PAGE
  ===================================================== */

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      {/* HEADER */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:border-black"
            >
              ← Shop
            </button>

            <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Your Cart
            </h1>
          </div>

          <span className="text-xs text-gray-600 sm:text-sm">
            {cartCount}{" "}
            {cartCount === 1 ? "item" : "items"}
          </span>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 px-3 py-6 md:grid-cols-[2fr_1fr] md:gap-8 md:px-6">
        {/* CART ITEMS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-600">
              Your Items
            </h2>

            <button
              type="button"
              onClick={clearCart}
              className="text-xs font-semibold text-gray-500 underline hover:text-red-600"
            >
              Clear Cart
            </button>
          </div>

          {cart.map((item) => {
            const key = cartItemKey(item);

            const lineTotal =
              item.price * item.quantity;

            return (
              <article
                key={key}
                className="rounded-xl border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  {/* PRODUCT INFORMATION */}
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/product/${encodeURIComponent(item.id)}`
                        )
                      }
                      className="text-left text-sm font-semibold text-gray-900 hover:underline"
                    >
                      {item.name}
                    </button>

                    {(item.size || item.color) && (
                      <p className="mt-2 text-xs text-gray-500">
                        {item.size && (
                          <span>
                            Size: {item.size}
                          </span>
                        )}

                        {item.size &&
                          item.color &&
                          " · "}

                        {item.color && (
                          <span>
                            Color: {item.color}
                          </span>
                        )}
                      </p>
                    )}

                    <p className="mt-2 text-sm font-semibold text-gray-900">
                      {format(item.price)} each
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Variant: {item.variant_id}
                    </p>
                  </div>

                  {/* QUANTITY AND REMOVE */}
                  <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                    <div className="flex items-center overflow-hidden rounded-full border border-gray-300">
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            key,
                            item.quantity - 1
                          )
                        }
                        disabled={item.quantity <= 1}
                        className="px-4 py-2 text-sm font-bold transition hover:bg-gray-100 disabled:opacity-30"
                        aria-label={`Decrease quantity of ${item.name}`}
                      >
                        −
                      </button>

                      <span className="min-w-8 text-center text-sm font-semibold">
                        {item.quantity}
                      </span>

                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(
                            key,
                            item.quantity + 1
                          )
                        }
                        className="px-4 py-2 text-sm font-bold transition hover:bg-gray-100"
                        aria-label={`Increase quantity of ${item.name}`}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(key)}
                      className="text-xs font-semibold text-gray-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* LINE TOTAL */}
                <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-xs text-gray-500">
                    Item total
                  </span>

                  <span className="text-sm font-bold">
                    {format(lineTotal)}
                  </span>
                </div>
              </article>
            );
          })}
        </div>

        {/* ORDER SUMMARY */}
        <aside className="h-fit rounded-xl border border-gray-200 bg-white p-5 md:sticky md:top-6">
          <h2 className="mb-5 text-lg font-bold text-gray-900">
            Order Summary
          </h2>

          <div className="mb-3 flex justify-between text-sm text-gray-700">
            <span>
              Subtotal ({cartCount}{" "}
              {cartCount === 1 ? "item" : "items"})
            </span>

            <span className="font-semibold">
              {format(subtotalUSD)}
            </span>
          </div>

          <div className="mb-4 flex justify-between gap-3 text-sm text-gray-500">
            <span>Shipping</span>

            <span className="text-right">
              Calculated at checkout
            </span>
          </div>

          <div className="mb-5 flex justify-between border-t border-gray-200 pt-4 text-base font-bold text-gray-900">
            <span>Subtotal</span>
            <span>{format(subtotalUSD)}</span>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            className="w-full rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-900"
          >
            Proceed to Checkout
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-3 w-full rounded-lg border border-black bg-white px-4 py-3 text-sm font-semibold text-black transition hover:bg-gray-100"
          >
            Continue Shopping
          </button>

          <p className="mt-4 text-center text-xs leading-relaxed text-gray-500">
            Shipping and any applicable taxes are
            calculated during checkout.
          </p>
        </aside>
      </section>
    </main>
  );
}
