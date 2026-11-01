
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { useCart } from "../../CartContext";

function SuccessContent() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const { clearCart } = useCart();

  const [status, setStatus] = useState<
    "loading" | "paid" | "pending" | "error"
  >("loading");

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      return;
    }

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch(
          `/api/checkout/status?session_id=${encodeURIComponent(
            sessionId!
          )}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error("Verification failed");
        }

        const data = await response.json();

        if (cancelled) return;

        if (data.paid) {
          setStatus("paid");
          clearCart();
        } else {
          setStatus("pending");
        }
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    verify();

    return () => {
      cancelled = true;
    };
  }, [sessionId, clearCart]);

  const title =
    status === "paid"
      ? "Payment Successful"
      : status === "pending"
      ? "Payment Pending"
      : status === "error"
      ? "Unable to Verify Payment"
      : "Verifying Your Payment";

  const description =
    status === "paid"
      ? "Thank you for shopping Zodiac DatN. Your payment has been received. Your order will be processed separately."
      : status === "pending"
      ? "Your payment has not been confirmed yet. Please check again shortly."
      : status === "error"
      ? "We could not verify this checkout session. Please contact support if you were charged."
      : "Please wait while we securely check your payment.";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-5 text-black">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <div className="mb-5 text-4xl">
          {status === "paid" ? "✓" : "✦"}
        </div>

        <h1 className="text-3xl font-bold">
          {title}
        </h1>

        <p className="mt-4 text-sm leading-6 text-gray-500">
          {description}
        </p>

        {status === "paid" && sessionId && (
          <p className="mt-5 break-all text-xs text-gray-400">
            Payment reference: {sessionId}
          </p>
        )}

        <Link
          href="/"
          className="mt-8 block rounded-xl bg-black px-6 py-4 text-sm font-bold text-white"
        >
          Continue Shopping
        </Link>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-screen items-center justify-center bg-white text-black">
        Verifying payment...
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}
