
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRINTIFY_BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/+$/, "");

const PAGE_SIZE = 50;
const CACHE_SECONDS = 60;

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  visible?: boolean;
  tags?: string[];
  images?: unknown[];
  variants?: unknown[];
  options?: unknown[];
  [key: string]: unknown;
};

type PrintifyResponse = {
  current_page: number;
  last_page: number;
  total: number;
  data: PrintifyProduct[];
};

async function getPage(
  shopId: string,
  token: string,
  page: number
): Promise<PrintifyResponse> {
  const url =
    `${PRINTIFY_BASE_URL}/shops/${shopId}` +
    `/products.json?limit=${PAGE_SIZE}&page=${page}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response.text();

    throw new Error(
      `Printify page ${page}: HTTP ${response.status} ${error.slice(0, 200)}`
    );
  }

  return response.json();
}

export async function GET() {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    return NextResponse.json(
      { error: "Printify credentials missing" },
      { status: 500 }
    );
  }

  try {
    const first = await getPage(
      shopId,
      token,
      1
    );

    const allProducts: PrintifyProduct[] = [
      ...(first.data || []),
    ];

    const lastPage = Math.max(
      1,
      Number(first.last_page) || 1
    );

    // Fetch every remaining page in batches of 5.
    for (
      let page = 2;
      page <= lastPage;
      page += 5
    ) {
      const pageNumbers = Array.from(
        {
          length: Math.min(
            5,
            lastPage - page + 1
          ),
        },
        (_, index) => page + index
      );

      const results = await Promise.all(
        pageNumbers.map((number) =>
          getPage(shopId, token, number)
        )
      );

      for (const result of results) {
        allProducts.push(...(result.data || []));
      }
    }

    // Remove duplicate product IDs.
    const uniqueProducts = Array.from(
      new Map(
        allProducts.map((product) => [
          product.id,
          product,
        ])
      ).values()
    );

    // Keep visible products.
    const publishedProducts =
      uniqueProducts.filter(
        (product) =>
          product.visible !== false
      );

    console.log("FabricX Printify sync", {
      printifyTotal: first.total,
      pagesFetched: lastPage,
      productsRetrieved: uniqueProducts.length,
      productsVisible: publishedProducts.length,
    });

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
            `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=120`,
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
        error: "Failed to load Printify catalog",
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
