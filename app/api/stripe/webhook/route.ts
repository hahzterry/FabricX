
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PrintifyLineItem = {
  product_id: string;
  variant_id: number;
  quantity: number;
};

type PrintifyOrderResponse = {
  id?: string;
};

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const printifyToken = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (
    !stripeKey ||
    !webhookSecret ||
    !printifyToken ||
    !shopId
  ) {
    console.error(
      "Missing Stripe or Printify environment variables."
    );

    return NextResponse.json(
      { error: "Service not configured." },
      { status: 503 }
    );
  }

  const stripe = new Stripe(stripeKey);

  const signature = request.headers.get(
    "stripe-signature"
  );

  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature." },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    const rawBody = await request.text();

    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error
    );

    return NextResponse.json(
      { error: "Invalid webhook signature." },
      { status: 400 }
    );
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !==
      "checkout.session.async_payment_succeeded"
  ) {
    return NextResponse.json({
      received: true,
    });
  }

  try {
    const eventSession =
      event.data.object as Stripe.Checkout.Session;

    if (
      eventSession.payment_status !== "paid" ||
      eventSession.metadata?.store !== "zodiacdatn"
    ) {
      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    const session =
      await stripe.checkout.sessions.retrieve(
        eventSession.id
      );

    if (
      session.payment_status !== "paid" ||
      session.metadata?.store !== "zodiacdatn"
    ) {
      return NextResponse.json({
        received: true,
        processed: false,
      });
    }

    const shipping =
      session.collected_information?.shipping_details;

    const address = shipping?.address;

    const customerEmail =
      session.customer_details?.email;

    if (
      !shipping ||
      !address ||
      !customerEmail ||
      !address.line1 ||
      !address.city ||
      !address.postal_code ||
      !address.country
    ) {
      throw new Error(
        "Missing required customer shipping information."
      );
    }

    const lineItems =
      await stripe.checkout.sessions.listLineItems(
        session.id,
        {
          limit: 100,
          expand: ["data.price.product"],
        }
      );

    if (
      lineItems.has_more ||
      lineItems.data.length === 0
    ) {
      throw new Error(
        "Invalid or incomplete Stripe checkout line items."
      );
    }

    const printifyItems: PrintifyLineItem[] =
      lineItems.data.map((line) => {
        const product = line.price?.product;

        // Stripe products may be string IDs,
        // active Product objects, or DeletedProduct objects.
        // Only active Product objects contain metadata.

        if (
          !product ||
          typeof product === "string" ||
          product.deleted === true
        ) {
          throw new Error(
            "Missing, unexpanded, or deleted Stripe product."
          );
        }

        const productId =
          product.metadata.printify_product_id;

        const variantId = Number(
          product.metadata.printify_variant_id
        );

        const quantity = line.quantity;

        if (
          !productId ||
          !/^[a-zA-Z0-9_-]+$/.test(productId) ||
          !Number.isSafeInteger(variantId) ||
          variantId <= 0 ||
          !Number.isSafeInteger(quantity) ||
          !quantity ||
          quantity <= 0
        ) {
          throw new Error(
            "Invalid Printify product, variant, or quantity."
          );
        }

        return {
          product_id: productId,
          variant_id: variantId,
          quantity,
        };
      });

    const customerName =
      shipping.name ||
      session.customer_details?.name ||
      "Customer";

    const nameParts = customerName
      .trim()
      .split(/\s+/);

    const firstName =
      nameParts.shift() || "Customer";

    const lastName =
      nameParts.join(" ") || "-";

    const baseUrl = (
      process.env.PRINTIFY_BASE_URL ||
      "https://api.printify.com/v1"
    ).replace(/\/+$/, "");

    const orderPayload = {
      external_id: session.id,
      label: session.id,

      line_items: printifyItems,

      shipping_method: 1,

      send_shipping_notification: true,

      address_to: {
        first_name: firstName,
        last_name: lastName,
        email: customerEmail,

        phone:
          session.customer_details?.phone || "",

        address1: address.line1,
        address2: address.line2 || "",

        city: address.city,
        state: address.state || "",

        zip: address.postal_code,
        country: address.country,
      },
    };

    const printifyResponse = await fetch(
      `${baseUrl}/shops/${encodeURIComponent(
        shopId
      )}/orders.json`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${printifyToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },

        body: JSON.stringify(orderPayload),

        cache: "no-store",
      }
    );

    if (!printifyResponse.ok) {
      const errorDetails =
        await printifyResponse.text();

      console.error(
        "Printify order creation failed:",
        {
          status: printifyResponse.status,
          stripeSessionId: session.id,
          details: errorDetails,
        }
      );

      throw new Error(
        `Printify returned HTTP ${printifyResponse.status}`
      );
    }

    const printifyOrder =
      (await printifyResponse.json()) as
        PrintifyOrderResponse;

    console.info(
      "Stripe payment verified and Printify order created:",
      {
        stripeSessionId: session.id,
        printifyOrderId: printifyOrder.id,
        items: printifyItems.length,
      }
    );

    return NextResponse.json(
      {
        received: true,
        processed: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "Stripe webhook fulfillment error:",
      error
    );

    // Returning 500 allows Stripe to retry
    // webhook delivery after a processing failure.
    return NextResponse.json(
      {
        error: "Order fulfillment failed.",
      },
      { status: 500 }
    );
  }
}
