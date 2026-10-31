
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const PRINTIFY_BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/+$/, "");

const CACHE_SECONDS = 300;
const BATCH_SIZE = 5;

type PrintifyProduct = {
  id: string;
  title: string;
  visible?: boolean;
  description?: string;
  tags?: string[];
  images?: unknown[];
  variants?: unknown[];
  options?: unknown[];
  [key: string]: unknown;
};

type PrintifyListResponse = {
  current_page: number;
  last_page?: number;
  data: PrintifyProduct[];
};

async function printifyFetch<T>(
  url: string
): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
      Accept: "application/json",
    },
    next: {
      revalidate: CACHE_SECONDS,
    },
  });

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      `Printify ${response.status}: ${message.slice(0, 300)}`
    );
  }

  return (await response.json()) as T;
}

export async function GET() {
  if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
    return NextResponse.json(
      { error: "Printify API not configured" },
      { status: 500 }
    );
  }

  try {
    const productsBaseUrl =
      `${PRINTIFY_BASE_URL}/shops/` +
      `${PRINTIFY_SHOP_ID}/products`;

    const listUrl = `${productsBaseUrl}.json`;

    // 1. Retrieve the first page.
    const firstPage =
      await printifyFetch<PrintifyListResponse>(
        `${listUrl}?limit=50&page=1`
      );

    const allProducts = [...(firstPage.data ?? [])];

    const lastPage = Math.max(
      1,
      firstPage.last_page ?? 1
    );

    // 2. Retrieve every remaining page.
    for (
      let page = 2;
      page <= lastPage;
      page += BATCH_SIZE
    ) {
      const pages = Array.from(
        {
          length: Math.min(
            BATCH_SIZE,
            lastPage - page + 1
          ),
        },
        (_, index) => page + index
      );

      const results = await Promise.all(
        pages.map((p) =>
          printifyFetch<PrintifyListResponse>(
            `${listUrl}?limit=50&page=${p}`
          )
        )
      );

      for (const result of results) {
        allProducts.push(...(result.data ?? []));
      }
    }

    // 3. Remove duplicate products.
    const uniqueProducts = Array.from(
      new Map(
        allProducts.map((product) => [
          product.id,
          product,
        ])
      ).values()
    );

    // 4. Retrieve full product details.
    const fullProducts: PrintifyProduct[] = [];

    for (
      let i = 0;
      i < uniqueProducts.length;
      i += BATCH_SIZE
    ) {
      const batch = uniqueProducts.slice(
        i,
        i + BATCH_SIZE
      );

      const details = await Promise.all(
        batch.map(async (product) => {
          const detailUrl =
            `${productsBaseUrl}/${product.id}.json`;

          try {
            return await printifyFetch<PrintifyProduct>(
              detailUrl
            );
          } catch (error) {
            console.error(
              `Failed to load product ${product.id}:`,
              error
            );

            // Preserve the product from the list
            // if its detail request fails.
            return product;
          }
        })
      );

      fullProducts.push(...details);
    }

    // 5. Exclude hidden products.
    const publishedProducts = fullProducts.filter(
      (product) => product.visible !== false
    );

    console.log("FabricX catalog loaded:", {
      pages: lastPage,
      retrieved: uniqueProducts.length,
      published: publishedProducts.length,
    });

    // 6. Return all products in the format
    // expected by ProductsContext.tsx.
    return NextResponse.json(
      {
        current_page: 1,
        last_page: lastPage,
        total: publishedProducts.length,
        data: publishedProducts,
      },
      {
        headers: {
          "Vercel-CDN-Cache-Control":
            "s-maxage=300, stale-while-revalidate=600",
          "Cache-Control":
            "public, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "FabricX catalog error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load Printify products",
      },
      {
        status: 502,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
