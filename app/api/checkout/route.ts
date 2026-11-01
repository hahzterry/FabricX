
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CheckoutItem = {
  id: string;
  variant_id: number;
  quantity: number;
};

type PrintifyVariant = {
  id: number;
  price: number;
  is_enabled?: boolean;
  is_available?: boolean;
};

type PrintifyProduct = {
  id: string;
  title: string;
  variants: PrintifyVariant[];
  visible?: boolean;
};

function parseItems(value: unknown): CheckoutItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Your cart is empty.");
  }

  if (value.length > 50) {
    throw new Error("Too many cart items.");
  }

  const merged = new Map<string, CheckoutItem>();

  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      throw new Error("Invalid cart item.");
    }

    const item = raw as Record<string, unknown>;

    if (
      typeof item.id !== "string" ||
      !/^[a-zA-Z0-9_-]{1,100}$/.test(item.id)
    ) {
      throw new Error("Invalid product ID.");
    }

    const variantId = Number(item.variant_id);
    const quantity = Number(item.quantity);

    if (
      !Number.isSafeInteger(variantId) ||
      variantId <= 0 ||
      !Number.isSafeInteger(quantity) ||
      quantity < 1 ||
      quantity > 99
    ) {
      throw new Error("Invalid variant or quantity.");
    }

    const key = `${item.id}:${variantId}`;
    const previous = merged.get(key);

    const nextQuantity =
      (previous?.quantity ?? 0) + quantity;

    if (nextQuantity > 99) {
      throw new Error("Quantity limit exceeded.");
    }

    merged.set(key, {
      id: item.id,
      variant_id: variantId,
      quantity: nextQuantity,
    });
  }

  return [...merged.values()];
}

export async function POST(request: NextRequest) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const printifyToken = process.env.PRINTIFY_API_TOKEN;
    const shopId = process.env.PRINTIFY_SHOP_ID;

    if (!stripeKey || !printifyToken || !shopId) {
      console.error("Missing checkout environment variables.");

      return NextResponse.json(
        { error: "Checkout is not configured." },
        { status: 503 }
      );
    }

    const stripe = new Stripe(stripeKey);

    const body = await request.json();
    const items = parseItems(body?.items);

    const products = new Map<string, PrintifyProduct>();

    await Promise.all(
      [...new Set(items.map((item) => item.id))].map(
        async (id) => {
          const response = await fetch(
            `https://api.printify.com/v1/shops/${encodeURIComponent(
              shopId
            )}/products/${encodeURIComponent(id)}.json`,
            {
              headers: {
                Authorization: `Bearer ${printifyToken}`,
                Accept: "application/json",
              },
              cache: "no-store",
            }
          );

          if (!response.ok) {
            throw new Error(
              "Unable to verify a product in your cart."
            );
          }

          const product =
            (await response.json()) as PrintifyProduct;

          products.set(id, product);
        }
      )
    );

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] =
      items.map((item) => {
        const product = products.get(item.id);

        if (!product || product.visible === false) {
          throw new Error("Product is unavailable.");
        }

        const variant = product.variants?.find(
          (entry) => entry.id === item.variant_id
        );

        if (
          !variant ||
          variant.is_enabled === false ||
          variant.is_available === false ||
          !Number.isSafeInteger(variant.price) ||
          variant.price <= 0
        ) {
          throw new Error(
            `Unavailable variant for ${product.title}.`
          );
        }

        // Printify retail prices are in cents.
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: product.title,
              metadata: {
                printify_product_id: item.id,
                printify_variant_id: String(
                  item.variant_id
                ),
              },
            },
            unit_amount: variant.price,
          },
          quantity: item.quantity,
        };
      });

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,

      billing_address_collection: "required",

      shipping_address_collection: {
        allowed_countries: ["US"],
      },

      phone_number_collection: {
        enabled: true,
      },

      client_reference_id: crypto.randomUUID(),

      success_url:
        `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${origin}/checkout`,

      metadata: {
        source: "zodiacdatn",
        fulfillment_status: "pending",
      },
    });

    if (!session.url) {
      throw new Error("Stripe did not return a checkout URL.");
    }

    return NextResponse.json({
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error &&
          !/stripe|secret|api key/i.test(error.message)
            ? error.message
            : "Unable to start secure checkout.",
      },
      { status: 400 }
    );
  }
}
