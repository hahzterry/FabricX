
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const PRINTIFY_BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/$/, "");

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
    const error = await response.text();

    throw new Error(
      `Printify ${response.status}: ${error.slice(0, 300)}`
    );
  }

  return (await response.json()) as T;
}

async function fetchProductPage(
  listUrl: string,
  page: number
): Promise<PrintifyListResponse> {
  return printifyFetch<PrintifyListResponse>(
    `${listUrl}?limit=50&page=${page}`
  );
}

async function fetchAllProducts(
  listUrl: string
): Promise<PrintifyProduct[]> {
  const firstPage = await fetchProductPage(
    listUrl,
    1
  );

  const allProducts: PrintifyProduct[] = [
    ...(firstPage.data ?? []),
  ];

  const lastPage = Math.max(
    1,
    firstPage.last_page ?? 1
  );

  // Fetch all remaining catalog pages.
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
        fetchProductPage(listUrl, p)
      )
    );

    for (const result of results) {
      allProducts.push(...(result.data ?? []));
    }
  }

  // Deduplicate products by Printify ID.
  return Array.from(
    new Map(
      allProducts.map((product) => [
        product.id,
        product,
      ])
    ).values()
  );
}

async function fetchFullProductDetails(
  listUrl: string,
  products: PrintifyProduct[]
): Promise<PrintifyProduct[]> {
  const fullProducts: PrintifyProduct[] = [];

  for (
    let i = 0;
    i < products.length;
    i += BATCH_SIZE
  ) {
    const batch = products.slice(
      i,
      i + BATCH_SIZE
    );

    const results = await Promise.all(
      batch.map(async (product) => {
        try {
          return await printifyFetch<PrintifyProduct>(
            `${listUrl}/${product.id}.json`
          );
        } catch (error) {
          console.error(
            `Printify detail error for ${product.id}:`,
            error
          );

          // Keep the list product if its detail
          // request fails rather than losing it.
          return product;
        }
      })
    );

    fullProducts.push(...results);
  }

  return fullProducts;
}

export async function GET() {
  if (
    !PRINTIFY_API_TOKEN ||
    !PRINTIFY_SHOP_ID
  ) {
    return NextResponse.json(
      {
        error: "Printify API not configured",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const listUrl =
      `${PRINTIFY_BASE_URL}/shops/` +
      `${PRINTIFY_SHOP_ID}/products.json`;

    // Step 1: Retrieve the entire catalog.
    const catalog = await fetchAllProducts(
      listUrl
    );

    // Step 2: Retrieve full details.
    const products =
      await fetchFullProductDetails(
        listUrl,
        catalog
      );

    // Step 3: Show products that are not hidden.
    const publishedProducts = products.filter(
      (product) => product.visible !== false
    );

    const response = {
      current_page: 1,
      last_page: Math.max(
        1,
        Math.ceil(
          publishedProducts.length / 50
        )
      ),
      total: publishedProducts.length,
      data: publishedProducts,
    };

    console.log("FabricX Printify catalog:", {
      total: catalog.length,
      published: publishedProducts.length,
    });

    return NextResponse.json(response, {
      headers: {
        // Vercel CDN cache.
        "Vercel-CDN-Cache-Control":
          "s-maxage=300, stale-while-revalidate=600",

        // Avoid persistent browser caching.
        "Cache-Control":
          "public, max-age=0",

        // Help other CDN layers.
        "CDN-Cache-Control":
          "s-maxage=300",
      },
    });
  } catch (error) {
    console.error(
      "FabricX Printify API error:",
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
