
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/+$/, "");

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  if (!TOKEN || !SHOP_ID) {
    return NextResponse.json(
      { error: "Printify API not configured" },
      { status: 500 }
    );
  }

  const { id } = await context.params;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return NextResponse.json(
      { error: "Invalid product ID" },
      { status: 400 }
    );
  }

  try {
    const url =
      `${BASE_URL}/shops/${encodeURIComponent(SHOP_ID)}` +
      `/products/${encodeURIComponent(id)}.json`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (response.status === 404) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!response.ok) {
      console.error(
        "Printify product lookup failed:",
        response.status,
        await response.text()
      );

      return NextResponse.json(
        { error: "Unable to retrieve product" },
        { status: 502 }
      );
    }

    const product = await response.json();

    return NextResponse.json(product, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Product API error:", error);

    return NextResponse.json(
      { error: "Unable to load product" },
      { status: 502 }
    );
  }
}
