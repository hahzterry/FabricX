
 // app/api/fabricx/products/route.ts
import { NextResponse } from "next/server";

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const PRINTIFY_BASE_URL =
  process.env.PRINTIFY_BASE_URL || "https://api.printify.com/v1";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type PrintifyProduct = {
  id: string;
  title: string;
  visible?: boolean;
  description?: string;
  tags?: string[];
  options?: unknown[];
  variants?: unknown[];
  images?: unknown[];
};

type PrintifyListResponse = {
  current_page: number;
  last_page: number;
  total: number;
  data: PrintifyProduct[];
};

const headers = {
  Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
  "Content-Type": "application/json",
};

async function fetchPrintifyPage(
  page: number
): Promise<PrintifyListResponse> {
  const url =
    `${PRINTIFY_BASE_URL}/shops/${PRINTIFY_SHOP_ID}` +
    `/products.json?limit=50&page=${page}`;

  const response = await fetch(url, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();

    console.error(
      `Printify page ${page} error:`,
      response.status,
      error
    );

    throw new Error(
      `Failed to fetch Printify page ${page}: ${response.status}`
    );
  }

  return response.json();
}

export async function GET() {
  if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
    return NextResponse.json(
      { error: "Printify API not configured" },
      { status: 500 }
    );
  }

  try {
    // Get the first page.
    const firstPage = await fetchPrintifyPage(1);

    const allProducts: PrintifyProduct[] = [
      ...(firstPage.data ?? []),
    ];

    const totalPages = Math.max(
      1,
      firstPage.last_page || 1
    );

    // Retrieve every remaining page.
    // Use small batches to avoid excessive concurrent requests.
    const BATCH_SIZE = 5;

    for (
      let page = 2;
      page <= totalPages;
      page += BATCH_SIZE
    ) {
      const pageNumbers = Array.from(
        {
          length: Math.min(
            BATCH_SIZE,
            totalPages - page + 1
          ),
        },
        (_, index) => page + index
      );

      const results = await Promise.all(
        pageNumbers.map(fetchPrintifyPage)
      );

      for (const result of results) {
        if (Array.isArray(result.data)) {
          allProducts.push(...result.data);
        }
      }
    }

    // Remove duplicates and unpublished products.
    const uniqueProducts = Array.from(
      new Map(
        allProducts.map((product) => [
          product.id,
          product,
        ])
      ).values()
    );

    const publishedProducts = uniqueProducts.filter(
      (product) => product.visible === true
    );

    // Printify list responses already include
    // images, variants, tags and product options.
    // No additional detail request is required
    // for the existing ProductsContext.

    console.log("FabricX Printify sync:", {
      shopId: PRINTIFY_SHOP_ID,
      totalPages,
      totalProducts: uniqueProducts.length,
      publishedProducts: publishedProducts.length,
    });

    // Preserve the response format expected by
    // app/ProductsContext.tsx.
    return NextResponse.json({
      current_page: 1,
      last_page: totalPages,
      total: publishedProducts.length,
      data: publishedProducts,
    });
  } catch (error) {
    console.error(
      "FabricX Printify products error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load Printify products",
      },
      { status: 502 }
    );
  }
}
