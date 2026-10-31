

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const BASE =
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1";

const CACHE_SECONDS = 300;

type Product = {
  id: string;
  title: string;
  visible?: boolean;
  tags?: string[];
  images?: unknown[];
  variants?: unknown[];
  options?: unknown[];
};

type PageResponse = {
  data: Product[];
  current_page: number;
  last_page: number;
};

async function getPage(
  shopId: string,
  token: string,
  page: number
): Promise<PageResponse> {
  const url =
    `${BASE}/shops/${shopId}/products.json` +
    `?limit=50&page=${page}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  if (!response.ok) {
    throw new Error(
      `Printify request failed: ${response.status}`
    );
  }

  return response.json();
}

export async function GET() {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    return NextResponse.json(
      { error: "Printify not configured" },
      { status: 500 }
    );
  }

  try {
    const first = await getPage(shopId, token, 1);
    const products = [...(first.data || [])];

    const lastPage = Math.max(1, first.last_page || 1);

    // Fetch remaining pages in small batches.
    for (let page = 2; page <= lastPage; page += 5) {
      const pages = Array.from(
        {
          length: Math.min(5, lastPage - page + 1),
        },
        (_, index) => page + index
      );

      const results = await Promise.all(
        pages.map((p) => getPage(shopId, token, p))
      );

      for (const result of results) {
        products.push(...(result.data || []));
      }
    }

    const unique = Array.from(
      new Map(products.map((p) => [p.id, p])).values()
    );

    const published = unique.filter(
      (p) => p.visible !== false
    );

    return NextResponse.json(
      {
        current_page: 1,
        last_page: lastPage,
        total: published.length,
        data: published,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Printify catalog error:", error);

    return NextResponse.json(
      { error: "Unable to load products" },
      { status: 502 }
    );
  }
}
