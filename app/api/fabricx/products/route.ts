
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const PRINTIFY_BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/$/, "");

export async function GET(request: NextRequest) {
  if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
    return NextResponse.json(
      { error: "Printify API is not configured" },
      { status: 500 }
    );
  }

  const searchParams = request.nextUrl.searchParams;

  const requestedPage = Number(searchParams.get("page") || 1);
  const requestedLimit = Number(searchParams.get("limit") || 50);

  const page =
    Number.isFinite(requestedPage) && requestedPage > 0
      ? Math.floor(requestedPage)
      : 1;

  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(100, Math.floor(requestedLimit))
      : 50;

  try {
    const url = new URL(
      `${PRINTIFY_BASE_URL}/shops/${PRINTIFY_SHOP_ID}/products.json`
    );

    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(limit));

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();

      console.error("Printify API error:", {
        status: response.status,
        page,
        details,
      });

      return NextResponse.json(
        {
          error: "Unable to fetch Printify products",
          status: response.status,
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    const products = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.products)
      ? result.products
      : Array.isArray(result)
      ? result
      : [];

    const currentPage = Number(result.current_page ?? page);
    const lastPage = Number(result.last_page ?? 0);
    const total = Number(result.total ?? 0);

    const hasMore =
      lastPage > 0
        ? currentPage < lastPage
        : total > 0
        ? currentPage * limit < total
        : products.length >= limit;

    return NextResponse.json(
      {
        products,
        data: products,
        current_page: currentPage,
        last_page: lastPage || null,
        total: total || null,
        per_page: limit,
        has_more: hasMore,
        next_page: hasMore ? currentPage + 1 : null,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Printify products exception:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
