
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

const PAGE_LIMIT = 50;

type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  images?: Array<{
    src: string;
    is_default?: boolean;
  }>;
  variants?: Array<{
    id: number;
    price: number;
    is_enabled?: boolean;
    is_available?: boolean;
  }>;
  [key: string]: unknown;
};

type PrintifyResponse = {
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  data?: PrintifyProduct[];
  [key: string]: unknown;
};

function respond(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

async function fetchPage(
  page: number
): Promise<PrintifyResponse> {
  const url = new URL(
    `${BASE_URL}/shops/${SHOP_ID}/products.json`
  );

  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(PAGE_LIMIT));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error(
      "Printify catalog error",
      response.status,
      await response.text()
    );

    throw new Error(
      `Printify returned ${response.status}`
    );
  }

  return (await response.json()) as PrintifyResponse;
}

export async function GET(request: NextRequest) {
  if (!TOKEN || !SHOP_ID) {
    return respond(
      { error: "Printify API not configured" },
      500
    );
  }

  try {
    const params = request.nextUrl.searchParams;

    const requestedPage = Number(
      params.get("page") ?? "1"
    );

    const page =
      Number.isSafeInteger(requestedPage) &&
      requestedPage > 0
        ? requestedPage
        : 1;

    const all = params.get("all") === "true";

    if (all) {
      const first = await fetchPage(1);

      const lastPage = Math.max(
        1,
        Number(first.last_page) || 1
      );

      const products = new Map<string, PrintifyProduct>();

      for (const product of first.data ?? []) {
        products.set(String(product.id), product);
      }

      const BATCH_SIZE = 3;

      for (
        let start = 2;
        start <= lastPage;
        start += BATCH_SIZE
      ) {
        const pageNumbers = Array.from(
          {
            length: Math.min(
              BATCH_SIZE,
              lastPage - start + 1
            ),
          },
          (_, index) => start + index
        );

        const results = await Promise.all(
          pageNumbers.map(fetchPage)
        );

        for (const result of results) {
          for (const product of result.data ?? []) {
            products.set(String(product.id), product);
          }
        }
      }

      const data = Array.from(products.values());

      return respond({
        data,
        current_page: 1,
        last_page: 1,
        per_page: data.length,
        total: data.length,
        has_more: false,
        next_page: null,
        all: true,
      });
    }

    const result = await fetchPage(page);
    const data = Array.isArray(result.data)
      ? result.data
      : [];

    const currentPage =
      Number(result.current_page) || page;

    const lastPage = Math.max(
      currentPage,
      Number(result.last_page) || currentPage
    );

    const hasMore = currentPage < lastPage;

    return respond({
      ...result,
      data,
      current_page: currentPage,
      last_page: lastPage,
      per_page: Number(result.per_page) || PAGE_LIMIT,
      total: result.total ?? data.length,
      has_more: hasMore,
      next_page: hasMore ? currentPage + 1 : null,
      all: false,
    });
  } catch (error) {
    console.error("Printify catalog failure:", error);

    return respond(
      { error: "Unable to load Printify products" },
      502
    );
  }
}
