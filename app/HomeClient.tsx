
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";

/* =========================================================
   ZODIAC CONFIGURATION
========================================================= */

const ZODIAC_SIGNS = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
] as const;

type ZodiacSign = (typeof ZODIAC_SIGNS)[number];
type CategoryName = "Home" | ZodiacSign;

const ZODIAC_SYMBOLS: Record<ZodiacSign, string> = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

const ZODIAC_DATES: Record<ZodiacSign, string> = {
  Aries: "March 21 – April 19",
  Taurus: "April 20 – May 20",
  Gemini: "May 21 – June 20",
  Cancer: "June 21 – July 22",
  Leo: "July 23 – August 22",
  Virgo: "August 23 – September 22",
  Libra: "September 23 – October 22",
  Scorpio: "October 23 – November 21",
  Sagittarius: "November 22 – December 21",
  Capricorn: "December 22 – January 19",
  Aquarius: "January 20 – February 18",
  Pisces: "February 19 – March 20",
};

const PAGE_SIZE = 50;
const DISPLAY_BATCH = 24;

/* =========================================================
   TYPES
========================================================= */

type PrintifyVariant = {
  id: number;
  title?: string;
  price: number;
  is_default?: boolean;
  is_enabled?: boolean;
  is_available?: boolean;
};

type PrintifyImage = {
  src: string;
  is_default?: boolean;
};

type PrintifyProduct = {
  id: string | number;
  title: string;
  description?: string;
  tags?: string[];
  variants?: PrintifyVariant[];
  images?: PrintifyImage[];
};

type UiProduct = {
  id: string;
  name: string;
  price: number;
  variantId: number | null;
  size: string;
  image: string;
  description: string;
  tags: string[];
  signs: ZodiacSign[];
};

type InitialProduct = Partial<UiProduct> & {
  id: string;
  name: string;
  price: number;
};

type Props = {
  initialProducts?: InitialProduct[];
};

type ApiResponse = {
  current_page?: number;
  last_page?: number | null;
  per_page?: number;
  total?: number | null;
  data?: PrintifyProduct[];
  products?: PrintifyProduct[];
  has_more?: boolean;
  next_page?: number | null;
  error?: string;
};

/* =========================================================
   ZODIAC MATCHING
========================================================= */

function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function detectZodiacSigns(
  title = "",
  tags: string[] = [],
  description = ""
): ZodiacSign[] {
  const titleText = title.toLowerCase();
  const tagText = tags.join(" ").toLowerCase();
  const descriptionText = stripHtml(description).toLowerCase();

  const searchable = [
    titleText,
    tagText,
    descriptionText,
  ].join(" ");

  return ZODIAC_SIGNS.filter((sign) => {
    const name = sign.toLowerCase();

    const exactPattern = new RegExp(
      `\\b${name}\\b`,
      "i"
    );

    const compact = searchable.replace(
      /[^a-z0-9]/g,
      ""
    );

    const combinedNames = [
      `${name}zodiac`,
      `zodiac${name}`,
      `${name}sign`,
      `${name}season`,
      `${name}astrology`,
      `${name}horoscope`,
    ];

    return (
      exactPattern.test(searchable) ||
      combinedNames.some((value) =>
        compact.includes(value)
      )
    );
  });
}

/* =========================================================
   PRINTIFY DATA NORMALIZATION
========================================================= */

function normalizeProduct(
  product: PrintifyProduct
): UiProduct {
  const variants = Array.isArray(product.variants)
    ? product.variants
    : [];

  const selectedVariant =
    variants.find(
      (variant) =>
        variant.is_default === true &&
        variant.is_enabled !== false &&
        variant.is_available !== false
    ) ??
    variants.find(
      (variant) =>
        variant.is_enabled !== false &&
        variant.is_available !== false
    ) ??
    variants.find(
      (variant) =>
        variant.is_enabled !== false
    ) ??
    null;

  const images = Array.isArray(product.images)
    ? product.images
    : [];

  const selectedImage =
    images.find((image) => image.is_default)?.src ??
    images[0]?.src ??
    "";

  const tags = Array.isArray(product.tags)
    ? product.tags.map(String)
    : [];

  const title = String(product.title || "Zodiac Product");
  const description = String(product.description || "");

  return {
    id: String(product.id),
    name: title,
    price: selectedVariant
      ? selectedVariant.price / 100
      : 0,
    variantId: selectedVariant?.id ?? null,
    size: selectedVariant?.title ?? "Default",
    image: selectedImage,
    description,
    tags,
    signs: detectZodiacSigns(
      title,
      tags,
      description
    ),
  };
}

function normalizeInitialProduct(
  product: InitialProduct
): UiProduct {
  const tags = Array.isArray(product.tags)
    ? product.tags
    : [];

  const description = product.description ?? "";

  return {
    id: String(product.id),
    name: product.name,
    price: product.price,
    variantId: product.variantId ?? null,
    size: product.size ?? "Default",
    image: product.image ?? "",
    description,
    tags,
    signs: detectZodiacSigns(
      product.name,
      tags,
      description
    ),
  };
}

function extractProducts(
  response: ApiResponse | PrintifyProduct[]
): PrintifyProduct[] {
  if (Array.isArray(response)) {
    return response;
  }

  // Matches the actual Printify JSON provided.
  if (Array.isArray(response.data)) {
    return response.data;
  }

  // Also supports the custom API response format.
  if (Array.isArray(response.products)) {
    return response.products;
  }

  return [];
}

function getNextPage(
  response: ApiResponse | PrintifyProduct[],
  page: number,
  receivedCount: number
): number | null {
  if (Array.isArray(response)) {
    return receivedCount >= PAGE_SIZE
      ? page + 1
      : null;
  }

  if (response.has_more === false) {
    return null;
  }

  if (typeof response.next_page === "number") {
    return response.next_page > page
      ? response.next_page
      : null;
  }

  if (
    typeof response.last_page === "number" &&
    response.last_page > 0
  ) {
    return page < response.last_page
      ? page + 1
      : null;
  }

  if (
    typeof response.total === "number" &&
    response.total > 0
  ) {
    return page * PAGE_SIZE < response.total
      ? page + 1
      : null;
  }

  return receivedCount >= PAGE_SIZE
    ? page + 1
    : null;
}

/* =========================================================
   NEWSLETTER
========================================================= */

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function subscribe() {
    if (!email.trim()) {
      setStatus("Enter your email address.");
      return;
    }

    setSubmitting(true);
    setStatus("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok || data?.success === false) {
        throw new Error();
      }

      setEmail("");
      setStatus("Successfully subscribed!");
    } catch {
      setStatus("Unable to subscribe right now.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold">
        Join the Zodiac List
      </h3>

      <p className="mt-1 text-xs text-gray-500">
        Get exclusive zodiac drops and offers.
      </p>

      <input
        type="email"
        value={email}
        onChange={(event) =>
          setEmail(event.target.value)
        }
        placeholder="Email address"
        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black"
      />

      <button
        type="button"
        disabled={submitting}
        onClick={subscribe}
        className="mt-2 w-full rounded-lg bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {submitting ? "Subscribing..." : "Subscribe"}
      </button>

      {status && (
        <p className="mt-2 text-xs text-gray-500">
          {status}
        </p>
      )}
    </div>
  );
}

/* =========================================================
   HOME CLIENT
========================================================= */

export default function HomeClient({
  initialProducts = [],
}: Props) {
  const router = useRouter();

  const {
    addItem,
    toggleWishlist,
    isInWishlist,
    wishlist,
  } = useCart();

  const {
    currency,
    setCurrency,
    format,
  } = useCurrency();

  const [products, setProducts] = useState<UiProduct[]>(
    () =>
      initialProducts
        .filter(
          (product) =>
            product.id != null &&
            Boolean(product.name)
        )
        .map(normalizeInitialProduct)
  );

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryName>("Home");

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const [nextPage, setNextPage] =
    useState<number | null>(1);

  const [visibleCount, setVisibleCount] =
    useState(DISPLAY_BATCH);

  const [totalProducts, setTotalProducts] =
    useState<number | null>(null);

  const [cartMessage, setCartMessage] = useState("");

  const loadingRef = useRef(false);
  const loadedPagesRef = useRef<Set<number>>(
    new Set()
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* =======================================================
     LOAD PRODUCTS
  ======================================================= */

  const loadProducts = useCallback(
    async (
      page: number,
      refresh = false
    ): Promise<void> => {
      if (loadingRef.current) {
        return;
      }

      if (
        !refresh &&
        loadedPagesRef.current.has(page)
      ) {
        return;
      }

      loadingRef.current = true;

      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError("");

      try {
        const response = await fetch(
          `/api/printify/products?page=${page}&limit=${PAGE_SIZE}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(
            `Product API returned ${response.status}`
          );
        }

        const result:
          | ApiResponse
          | PrintifyProduct[] =
          await response.json();

        const rawProducts = extractProducts(result);

        const normalizedProducts = rawProducts
          .filter(
            (product) =>
              product != null &&
              product.id != null &&
              typeof product.title === "string"
          )
          .map(normalizeProduct);

        if (refresh) {
          loadedPagesRef.current.clear();
          setVisibleCount(DISPLAY_BATCH);
        }

        let uniqueCount = 0;

        setProducts((previous) => {
          const productMap = new Map<
            string,
            UiProduct
          >();

          if (!refresh) {
            for (const product of previous) {
              productMap.set(
                product.id,
                product
              );
            }
          }

          for (const product of normalizedProducts) {
            if (!productMap.has(product.id)) {
              uniqueCount++;
            }

            productMap.set(
              product.id,
              product
            );
          }

          return Array.from(
            productMap.values()
          );
        });

        loadedPagesRef.current.add(page);

        if (
          !Array.isArray(result) &&
          typeof result.total === "number"
        ) {
          setTotalProducts(result.total);
        }

        const calculatedNextPage = getNextPage(
          result,
          page,
          rawProducts.length
        );

        if (rawProducts.length === 0) {
          setNextPage(null);
        } else {
          setNextPage(calculatedNextPage);
        }

        console.info(
          "[Zodiac Datn] Printify page loaded",
          {
            page,
            received: rawProducts.length,
            mapped: normalizedProducts.length,
            uniqueCount,
            nextPage: calculatedNextPage,
          }
        );
      } catch (err) {
        console.error(
          "[Zodiac Datn] Product loading failed",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadProducts(1);
  }, [loadProducts]);

  /* =======================================================
     CATEGORY COUNTS
  ======================================================= */

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<
      ZodiacSign,
      number
    >;

    for (const sign of ZODIAC_SIGNS) {
      counts[sign] = products.filter(
        (product) =>
          product.signs.includes(sign)
      ).length;
    }

    return counts;
  }, [products]);

  /* =======================================================
     SEARCH AND FILTERS
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return products.filter((product) => {
      const categoryMatches =
        selectedCategory === "Home" ||
        product.signs.includes(
          selectedCategory
        );

      const searchMatches =
        !query ||
        [
          product.name,
          stripHtml(product.description),
          ...product.tags,
          ...product.signs,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return categoryMatches && searchMatches;
    });
  }, [
    products,
    selectedCategory,
    searchTerm,
  ]);

  useEffect(() => {
    setVisibleCount(DISPLAY_BATCH);
  }, [
    selectedCategory,
    searchTerm,
  ]);

  const visibleProducts = filteredProducts.slice(
    0,
    visibleCount
  );

  const hasMoreVisible =
    visibleCount < filteredProducts.length;

  /* =======================================================
     INFINITE SCROLL
  ======================================================= */

  useEffect(() => {
    const element = sentinelRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) {
          return;
        }

        if (hasMoreVisible) {
          setVisibleCount((current) =>
            Math.min(
              current + DISPLAY_BATCH,
              filteredProducts.length
            )
          );

          return;
        }

        if (
          nextPage !== null &&
          !loadingRef.current
        ) {
          void loadProducts(nextPage);
        }
      },
      {
        rootMargin: "400px",
      }
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [
    hasMoreVisible,
    filteredProducts.length,
    nextPage,
    loadProducts,
  ]);

  /* =======================================================
     USER ACTIONS
  ======================================================= */

  function selectCategory(
    category: CategoryName
  ) {
    setSelectedCategory(category);
    setMobileMenuOpen(false);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openProduct(id: string) {
    router.push(
      `/product/${encodeURIComponent(id)}`
    );
  }

  function addProductToCart(product: UiProduct) {
    if (product.variantId === null) {
      openProduct(product.id);
      return;
    }

    try {
      addItem({
        id: product.id,
        variant_id: product.variantId,
        name: product.name,
        price: product.price,
        size: product.size,
      });

      setCartMessage(
        `${product.name} added to cart.`
      );
    } catch (err) {
      console.error("Cart error:", err);

      setCartMessage(
        "Unable to add product to cart."
      );
    }
  }

  /* =======================================================
     SIDEBAR CONTENT
  ======================================================= */

  const categoryNavigation = (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() =>
          selectCategory("Home")
        }
        className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-semibold ${
          selectedCategory === "Home"
            ? "bg-black text-white"
            : "text-gray-700 hover:bg-gray-100"
        }`}
      >
        <span>All Products</span>
        <span>{products.length}</span>
      </button>

      {ZODIAC_SIGNS.map((sign) => (
        <button
          key={sign}
          type="button"
          onClick={() =>
            selectCategory(sign)
          }
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
            selectedCategory === sign
              ? "bg-black font-semibold text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">
              {ZODIAC_SYMBOLS[sign]}
            </span>

            {sign}
          </span>

          <span className="text-xs opacity-60">
            {categoryCounts[sign]}
          </span>
        </button>
      ))}
    </div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="rounded-lg border border-black px-3 py-2 text-sm lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <button
              type="button"
              onClick={() =>
                selectCategory("Home")
              }
              className="text-left text-lg font-black tracking-tight sm:text-xl"
            >
              Zodiac Datn Shop
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Currency"
              value={currency}
              onChange={(event) =>
                setCurrency(
                  event.target.value as typeof currency
                )
              }
              className="rounded-lg border border-black bg-white px-2 py-2 text-xs"
            >
              {[
                "USD",
                "EUR",
                "GBP",
                "INR",
                "JPY",
                "AUD",
                "CAD",
                "CHF",
              ].map((code) => (
                <option
                  key={code}
                  value={code}
                >
                  {code}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                router.push("/wishlist")
              }
              className="px-1 text-xl"
              aria-label={`Wishlist: ${wishlist.length} items`}
            >
              {wishlist.length > 0
                ? "♥"
                : "♡"}
            </button>

            <button
              type="button"
              onClick={() =>
                router.push("/cart")
              }
              className="px-1 text-xl"
              aria-label="Shopping cart"
            >
              🛒
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-3 pb-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
            placeholder="Search Zodiac Merch..."
            className="w-full rounded-full border border-gray-300 bg-gray-50 px-5 py-3 text-sm outline-none focus:border-black"
          />
        </div>
      </header>

      {/* MOBILE NAVIGATION */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() =>
            setMobileMenuOpen(false)
          }
        >
          <aside
            className="h-full w-72 max-w-[85vw] overflow-y-auto bg-white p-4"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold">
                Shop Your Sign
              </h2>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            {categoryNavigation}

            <div className="mt-6">
              <NewsletterBox />
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <a
                href="/orders"
                className="block"
              >
                My Orders
              </a>

              <a
                href="/cart"
                className="block"
              >
                Shopping Cart
              </a>

              <a
                href="/wishlist"
                className="block"
              >
                Wishlist
              </a>
            </div>
          </aside>
        </div>
      )}

      <div className="mx-auto flex max-w-7xl">
        {/* DESKTOP SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white p-4 lg:block">
          <h2 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">
            Shop by Zodiac
          </h2>

          {categoryNavigation}

          <div className="mt-8">
            <NewsletterBox />
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="min-w-0 flex-1">
          {/* HERO */}
          <section className="bg-white px-4 py-8 text-center sm:py-12">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Wear Your Energy
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {selectedCategory === "Home"
                ? "Shop Your Zodiac Sign"
                : `${ZODIAC_SYMBOLS[selectedCategory]} ${selectedCategory}`}
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">
              {selectedCategory === "Home"
                ? "Discover zodiac inspired fashion for your sign, your energy, and your style."
                : `${ZODIAC_DATES[selectedCategory]} · Explore merchandise inspired by your zodiac sign.`}
            </p>

            {selectedCategory !== "Home" && (
              <button
                type="button"
                onClick={() =>
                  selectCategory("Home")
                }
                className="mt-5 rounded-full border border-black px-5 py-2 text-xs font-bold"
              >
                View All Signs
              </button>
            )}
          </section>

          <section className="px-3 py-6 sm:px-5">
            {/* ZODIAC GRID */}
            {selectedCategory === "Home" && (
              <div className="mb-8">
                <h2 className="mb-4 text-xl font-black">
                  Find Your Sign
                </h2>

                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                  {ZODIAC_SIGNS.map((sign) => (
                    <button
                      key={sign}
                      type="button"
                      onClick={() =>
                        selectCategory(sign)
                      }
                      className="rounded-xl border border-gray-200 bg-white px-2 py-4 text-center transition hover:border-black hover:shadow-sm"
                    >
                      <div className="text-3xl">
                        {ZODIAC_SYMBOLS[sign]}
                      </div>

                      <div className="mt-2 text-xs font-bold">
                        {sign}
                      </div>

                      <div className="mt-1 text-[10px] text-gray-400">
                        {categoryCounts[sign]} products
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* COLLECTION HEADING */}
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-black">
                  {selectedCategory === "Home"
                    ? "Fresh Picks For You"
                    : `${selectedCategory} Collection`}
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  {filteredProducts.length} matching products loaded
                  {totalProducts !== null &&
                    ` · ${totalProducts} total products`}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  void loadProducts(1, true)
                }
                disabled={loading || loadingMore}
                className="rounded-lg border border-black bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {/* CART FEEDBACK */}
            {cartMessage && (
              <div
                role="status"
                className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 text-xs"
              >
                <span>{cartMessage}</span>

                <button
                  type="button"
                  onClick={() =>
                    router.push("/cart")
                  }
                  className="shrink-0 font-bold underline"
                >
                  View Cart
                </button>
              </div>
            )}

            {/* ERRORS */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={() =>
                    void loadProducts(
                      nextPage ?? 1
                    )
                  }
                  className="mt-2 font-bold underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* LOADING */}
            {loading && products.length === 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({
                  length: 8,
                }).map((_, index) => (
                  <div
                    key={index}
                    className="animate-pulse rounded-xl border bg-white p-3"
                  >
                    <div className="aspect-square rounded-lg bg-gray-200" />
                    <div className="mt-3 h-4 rounded bg-gray-200" />
                    <div className="mt-2 h-4 w-1/2 rounded bg-gray-100" />
                    <div className="mt-3 h-9 rounded bg-gray-200" />
                  </div>
                ))}
              </div>
            )}

            {/* EMPTY STATE */}
            {!loading &&
              filteredProducts.length === 0 && (
                <div className="rounded-xl border bg-white px-5 py-12 text-center">
                  <h3 className="text-lg font-bold">
                    No matching products found
                  </h3>

                  <p className="mt-2 text-sm text-gray-500">
                    Try another zodiac sign or search term.
                  </p>

                  {nextPage !== null && (
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() =>
                        void loadProducts(nextPage)
                      }
                      className="mt-4 rounded-full bg-black px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Load More Products
                    </button>
                  )}
                </div>
              )}

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {visibleProducts.map((product) => (
                <article
                  key={product.id}
                  className="group relative rounded-xl border border-gray-200 bg-white p-2 transition hover:border-black hover:shadow-md sm:p-3"
                >
                  {/* WISHLIST */}
                  <button
                    type="button"
                    onClick={() =>
                      toggleWishlist(product.id)
                    }
                    className="absolute right-3 top-3 z-10 rounded-full bg-white p-2 text-lg shadow-sm"
                    aria-label="Toggle wishlist"
                  >
                    {isInWishlist(product.id)
                      ? "♥"
                      : "♡"}
                  </button>

                  {/* IMAGE */}
                  <button
                    type="button"
                    onClick={() =>
                      openProduct(product.id)
                    }
                    className="block w-full"
                  >
                    <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          Image unavailable
                        </span>
                      )}
                    </div>
                  </button>

                  {/* PRODUCT INFORMATION */}
                  <div className="pt-3">
                    {product.signs.length > 0 && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {product.signs
                          .map(
                            (sign) =>
                              `${ZODIAC_SYMBOLS[sign]} ${sign}`
                          )
                          .join(" · ")}
                      </p>
                    )}

                    <h3 className="min-h-[2.5rem] line-clamp-2 text-xs font-semibold leading-5 sm:text-sm">
                      {product.name}
                    </h3>

                    <p className="mt-2 text-base font-black">
                      {format(product.price)}
                    </p>

                    {/* ACTIONS */}
                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          addProductToCart(product)
                        }
                        className="w-full rounded-lg bg-black px-2 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
                      >
                        Add to Cart
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openProduct(product.id)
                        }
                        className="w-full rounded-lg border border-black px-2 py-2.5 text-xs font-bold text-black transition hover:bg-gray-100"
                      >
                        Order Now
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* PAGINATION */}
            <div
              ref={sentinelRef}
              className="flex min-h-20 items-center justify-center py-8"
            >
              {loadingMore ? (
                <p className="text-sm text-gray-500">
                  Loading more products...
                </p>
              ) : hasMoreVisible ? (
                <button
                  type="button"
                  onClick={() =>
                    setVisibleCount(
                      (current) =>
                        current + DISPLAY_BATCH
                    )
                  }
                  className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold"
                >
                  Load More
                </button>
              ) : nextPage !== null ? (
                <button
                  type="button"
                  onClick={() =>
                    void loadProducts(nextPage)
                  }
                  className="rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold"
                >
                  Load More Products
                </button>
              ) : filteredProducts.length > 0 ? (
                <p className="text-xs text-gray-400">
                  You've reached the end of this collection.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="border-t border-gray-200 bg-white px-4 py-8 text-center">
        <h2 className="text-lg font-black">
          Zodiac Datn Shop
        </h2>

        <p className="mt-2 text-xs text-gray-500">
          Wear Your Sign. Express Your Energy.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-4 text-xs text-gray-600">
          <a href="/about">
            About
          </a>

          <a href="/contact">
            Contact
          </a>

          <a href="/shipping-policy">
            Shipping
          </a>

          <a href="/refund-policy">
            Refunds
          </a>

          <a href="/privacy-policy">
            Privacy
          </a>

          <a href="/terms">
            Terms
          </a>
        </div>
      </footer>
    </main>
  );
}
