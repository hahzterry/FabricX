
"use client";

import { useRouter } from "next/navigation";
import { useCart } from "../CartContext";

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();

  return (
    <main className="min-h-screen bg-white px-5 py-12 text-black">
      <div className="mx-auto max-w-xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-8 text-sm text-gray-500"
        >
          ← Back to shopping
        </button>

        <h1 className="text-center text-3xl font-bold">
          Checkout
        </h1>

        <p className="mt-3 text-center text-gray-500">
          Zodiac DatN Shop
        </p>

        <div className="mt-10 rounded-2xl border border-gray-200 p-6">
          <h2 className="text-xl font-semibold">
            Your Order
          </h2>

          <p className="mt-4 text-sm text-gray-600">
            Review your cart before proceeding to
            secure payment.
          </p>

          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="mt-6 w-full rounded-xl bg-black px-6 py-4 font-semibold text-white"
          >
            Review Cart
          </button>
        </div>
      </div>
    </main>
  );
}
