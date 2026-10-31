import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BASE_URL =
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1";

const TOKEN = process.env.PRINTIFY_API_TOKEN;
const SHOP_ID = process.env.PRINTIFY_SHOP_ID;

const PAGE_LIMIT = 50;
const DETAIL_BATCH_SIZE = 8;

type ProductSummary = {
  id: string;
  title: string;
};

type ProductListResponse = {
  current_page?: number;
  last_page?: number;
  data?: ProductSummary[];
};

async function printifyFetch(url: string) {
  if (!TOKEN) {
    throw new Error("Missing PRINTIFY_API_TOKEN");
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    throw new Error(
      `Printify API error ${response.status}: ${url}`
    );
  }

  return response.json();
}

async function fetchAllProductSummaries() {
  const products: ProductSummary[] = [];
  let page = 1;

  while (true) {
    const url =
      `${BASE_URL}/shops/${SHOP_ID}/products.json` +
      `?page=${page}&limit=${PAGE_LIMIT}`;

    const result = (await printifyFetch(
      url
    )) as ProductListResponse;

    const items = Array.isArray(result.data)
      ? result.data
      : [];

    products.push(...items);

    if (
      items.length === 0 ||
      (typeof result.last_page === "number" &&
        page >= result.last_page) ||
      (result.last_page == null &&
        items.length < PAGE_LIMIT)
    ) {
      break;
    }

    page++;
  }

  return Array.from(
    new Map(
      products.map((product) => [
        String(product.id),
        product,
      ])
    ).values()
  );
}

async function fetchProductDetails(
  products: ProductSummary[]
) {
  const results: any[] = [];

  for (
    let i = 0;
    i < products.length;
    i += DETAIL_BATCH_SIZE
  ) {
    const batch = products.slice(
      i,
      i + DETAIL_BATCH_SIZE
    );

    const details = await Promise.all(
      batch.map(async (product) => {
        try {
          return await printifyFetch(
            `${BASE_URL}/shops/${SHOP_ID}/products/${product.id}.json`
          );
        } catch (error) {
          console.error(
            "Failed to fetch product:",
            product.id,
            error
          );

          return null;
        }
      })
    );

    results.push(
      ...details.filter(
        (product) =>
          product !== null &&
          product.visible !== false
      )
    );
  }

  return results;
}

export async function GET() {
  if (!TOKEN || !SHOP_ID) {
    return NextResponse.json(
      {
        error: "Printify configuration missing",
        data: [],
      },
      { status: 500 }
    );
  }

  try {
    const summaries =
      await fetchAllProductSummaries();

    const products =
      await fetchProductDetails(summaries);

    return NextResponse.json(
      {
        success: true,
        total: products.length,
        current_page: 1,
        data: products,
      },
      {
        headers: {
          "Cache-Control":
            "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error(
      "Printify product loading failed:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Unable to load Printify products",
        data: [],
      },
      { status: 500 }
    );
  }
}
