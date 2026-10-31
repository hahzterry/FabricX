
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const PRINTIFY_BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/+$/, "");

const PAGE_LIMIT = 50;

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  visible?: boolean;
  images?: Array<{
    src: string;
    position?: string;
    is_default?: boolean;
  }>;
  variants?: Array<{
    id: number;
    price: number;
    is_enabled: boolean;
    is_available?: boolean;
  }>;
  [key: string]: unknown;
};

type PrintifyResponse = {
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  data?: PrintifyProduct[];
  [key: string]: unknown;
};

function jsonResponse(
  data: unknown,
  status = 200
) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control":
        "no-store, no-cache, must-revalidate",
    },
  });
}

async function fetchPrintifyPage(
  page: number
): Promise<PrintifyResponse> {
  const url = new URL(
    `${PRINTIFY_BASE_URL}/shops/${PRINTIFY_SHOP_ID}/products.json`
  );

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_LIMIT));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const message = await response.text();

    console.error("Printify API error:", {
      page,
      status: response.status,
      message,
    });

    throw new Error(
      `Printify request failed with status ${response.status}`
    );
  }

  return (await response.json()) as PrintifyResponse;
}

export async function GET(request: NextRequest) {
  if (!PRINTIFY_API_TOKEN || !PRINTIFY_SHOP_ID) {
    return jsonResponse(
      {
        error: "Printify API not configured",
      },
      500
    );
  }

  try {
    const params = request.nextUrl.searchParams;

    const rawPage = Number(params.get("page") ?? "1");

    const page =
      Number.isSafeInteger(rawPage) && rawPage >= 1
        ? rawPage
        : 1;

    const all = params.get("all") === "true";

    // Optional complete catalog retrieval.
    // Example: /api/printify/products?all=true
    if (all) {
      const firstPage = await fetchPrintifyPage(1);

      const firstProducts = Array.isArray(firstPage.data)
        ? firstPage.data
        : [];

      const lastPage = Math.max(
        1,
        Number(firstPage.last_page) || 1
      );

      const allProducts: PrintifyProduct[] = [
        ...firstProducts,
      ];

      // Fetch the remaining pages in small batches.
      // Avoid excessive simultaneous Printify requests.
      const BATCH_SIZE = 3;

      for (
        let start = 2;
        start <= lastPage;
        start += BATCH_SIZE
      ) {
        const pages = Array.from(
          {
            length: Math.min(
              BATCH_SIZE,
              lastPage - start + 1
            ),
          },
          (_, index) => start + index
        );

        const results = await Promise.all(
          pages.map(fetchPrintifyPage)
        );

        for (const result of results) {
          if (Array.isArray(result.data)) {
            allProducts.push(...result.data);
          }
        }
      }

      const uniqueProducts = Array.from(
        new Map(
          allProducts.map((product) => [
            product.id,
            product,
          ])
        ).values()
      );

      return jsonResponse({
        current_page: 1,
        last_page: 1,
        per_page: uniqueProducts.length,
        total: uniqueProducts.length,
        data: uniqueProducts,
        has_more: false,
        next_page: null,
        all: true,
      });
    }

    // Standard paginated retrieval.
    // Example: /api/printify/products?page=2
    const result = await fetchPrintifyPage(page);

    const products = Array.isArray(result.data)
      ? result.data
      : [];

    const currentPage =
      Number(result.current_page) || page;

    const lastPage = Math.max(
      currentPage,
      Number(result.last_page) || currentPage
    );

    const hasMore = currentPage < lastPage;

    return jsonResponse({
      ...result,
      data: products,
      current_page: currentPage,
      last_page: lastPage,
      per_page: Number(result.per_page) || PAGE_LIMIT,
      total: Number(result.total) || products.length,
      has_more: hasMore,
      next_page: hasMore ? currentPage + 1 : null,
      all: false,
    });
  } catch (error) {
    console.error("Printify products exception:", error);

    return jsonResponse(
      {
        error: "Unable to load Printify products",
      },
      502
    );
  }
}
