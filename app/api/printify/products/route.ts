
import {
  NextRequest,
  NextResponse,
} from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRINTIFY_BASE_URL = (
  process.env.PRINTIFY_BASE_URL ||
  "https://api.printify.com/v1"
).replace(/\/+$/, "");

const PAGE_SIZE = 50;

export async function GET(request: NextRequest) {
  const token = process.env.PRINTIFY_API_TOKEN;
  const shopId = process.env.PRINTIFY_SHOP_ID;

  if (!token || !shopId) {
    return NextResponse.json(
      {
        error: "Printify API is not configured.",
      },
      { status: 503 }
    );
  }

  const searchParams =
    request.nextUrl.searchParams;

  const requestedPage = Number(
    searchParams.get("page") || "1"
  );

  const requestedLimit = Number(
    searchParams.get("limit") || PAGE_SIZE
  );

  if (
    !Number.isSafeInteger(requestedPage) ||
    requestedPage < 1 ||
    !Number.isSafeInteger(requestedLimit) ||
    requestedLimit < 1 ||
    requestedLimit > 100
  ) {
    return NextResponse.json(
      {
        error: "Invalid pagination parameters.",
      },
      { status: 400 }
    );
  }

  try {
    const url = new URL(
      `${PRINTIFY_BASE_URL}/shops/${encodeURIComponent(
        shopId
      )}/products.json`
    );

    url.searchParams.set(
      "page",
      String(requestedPage)
    );

    url.searchParams.set(
      "limit",
      String(requestedLimit)
    );

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const details = await response.text();

      console.error("Printify products error:", {
        page: requestedPage,
        status: response.status,
        details,
      });

      return NextResponse.json(
        {
          error: "Unable to fetch Printify products.",
        },
        { status: 502 }
      );
    }

    const result = await response.json();

    const products = Array.isArray(result.data)
      ? result.data
      : Array.isArray(result.products)
        ? result.products
        : [];

    const currentPage =
      typeof result.current_page === "number"
        ? result.current_page
        : requestedPage;

    const lastPage =
      typeof result.last_page === "number"
        ? result.last_page
        : null;

    const total =
      typeof result.total === "number"
        ? result.total
        : null;

    const nextPage =
      lastPage !== null
        ? currentPage < lastPage
          ? currentPage + 1
          : null
        : products.length >= requestedLimit
          ? currentPage + 1
          : null;

    return NextResponse.json(
      {
        current_page: currentPage,
        data: products,
        total,
        last_page: lastPage,
        next_page: nextPage,
        has_more: nextPage !== null,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "no-store, no-cache, must-revalidate",
        },
      }
    );
  } catch (error) {
    console.error(
      "Printify pagination error:",
      error
    );

    return NextResponse.json(
      {
        error: "Unable to load products.",
      },
      { status: 500 }
    );
  }
}
