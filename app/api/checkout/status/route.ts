
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const sessionId =
      request.nextUrl.searchParams.get("session_id");

    if (
      !sessionId ||
      !/^cs_(test_|live_)/.test(sessionId)
    ) {
      return NextResponse.json(
        { error: "Invalid session." },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Payment service unavailable." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(
      process.env.STRIPE_SECRET_KEY
    );

    const session =
      await stripe.checkout.sessions.retrieve(sessionId);

    if (session.metadata?.store !== "zodiacdatn") {
      return NextResponse.json(
        { error: "Session not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      paid: session.payment_status === "paid",
      status: session.payment_status,
    });
  } catch (error) {
    console.error("Payment status error:", error);

    return NextResponse.json(
      { error: "Unable to verify payment." },
      { status: 500 }
    );
  }
}
