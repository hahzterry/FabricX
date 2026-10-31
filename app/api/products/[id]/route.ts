
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const PRINTIFY_API_TOKEN = process.env.PRINTIFY_API_TOKEN;
const PRINTIFY_SHOP_ID = process.env.PRINTIFY_SHOP_ID;
const PRINTIFY_BASE_URL =
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1";

const CACHE_SECONDS = 300;

type PrintifyListItem = {
  id: string;
  title: string;
};

type PrintifyListResponse = {
  current_page: number;
  last_page?: number;
  data: PrintifyListItem[];
};

async function printifyFetch(url: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${PRINTIFY_API_TOKEN}`,
      "Content-Type": "application/json",
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
    const listUrl =
      `${PRINTIFY_BASE_URL}/shops/${PRINTIFY_SHOP_ID}` +
      `/products.json`;

    // Fetch first page.
    const firstPage =
      (await printifyFetch(
        `${listUrl}?limit=50&page=1`
      )) as PrintifyListResponse;

    const allItems = [...(firstPage.data ?? [])];

    const lastPage = Math.max(
      1,
      firstPage.last_page ?? 1
    );

    // Fetch remaining pages.
    for (let page = 2; page <= lastPage; page += 5) {
      const pages = Array.from(
        {
          length: Math.min(5, lastPage - page + 1),
        },
        (_, index) => page + index
      );

      const results = await Promise.all(
        pages.map(
          (p) =>
            printifyFetch(
              `${listUrl}?limit=50&page=${p}`
            ) as Promise<PrintifyListResponse>
        )
      );

      for (const result of results) {
        allItems.push(...(result.data ?? []));
      }
    }

    // Remove duplicates.
    const uniqueItems = Array.from(
      new Map(
        allItems.map((item) => [item.id, item])
      ).values()
    );

    // Fetch full product details in small batches.
    const fullProducts: any[] = [];

    const BATCH_SIZE = 5;

    for (
      let i = 0;
      i < uniqueItems.length;
      i += BATCH_SIZE
    ) {
      const batch = uniqueItems.slice(
        i,
        i + BATCH_SIZE
      );

      const results = await Promise.all(
        batch.map(async (item) => {
          const detailUrl =
            `${listUrl}/${item.id}.json`;

          try {
            const detail = await printifyFetch(
              detailUrl
            );

            if (detail.visible === false) {
              return null;
            }

            return detail;
          } catch (error) {
            console.error(
              "Printify detail error:",
              item.id,
              error
            );

            return null;
          }
        })
      );

      fullProducts.push(
        ...results.filter(
          (product) => product !== null
        )
      );
    }

    return NextResponse.json(
      {
        current_page: 1,
        last_page: lastPage,
        total: fullProducts.length,
        data: fullProducts,
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
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
