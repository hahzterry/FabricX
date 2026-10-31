
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useCurrency } from "@/context/CurrencyContext";

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

type PrintifyProduct = {
  id: string | number;
  title: string;
  description?: string;
  tags?: string[];
  images?: {
    src: string;
    is_default?: boolean;
  }[];
  variants?: {
    id: number;
    price: number;
    title?: string;
    is_default?: boolean;
    is_enabled?: boolean;
    is_available?: boolean;
  }[];
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

type Props = {
  initialProducts?: PrintifyProduct[];
};

const PAGE_SIZE = 50;
const BATCH_SIZE = 24;

const SYMBOLS: Record<ZodiacSign, string> = {
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

const DATES: Record<ZodiacSign, string> = {
  Aries: "Mar 21 – Apr 19",
  Taurus: "Apr 20 – May 20",
  Gemini: "May 21 – Jun 20",
  Cancer: "Jun 21 – Jul 22",
  Leo: "Jul 23 – Aug 22",
  Virgo: "Aug 23 – Sep 22",
  Libra: "Sep 23 – Oct 22",
  Scorpio: "Oct 23 – Nov 21",
  Sagittarius: "Nov 22 – Dec 21",
  Capricorn: "Dec 22 – Jan 19",
  Aquarius: "Jan 20 – Feb 18",
  Pisces: "Feb 19 – Mar 20",
};

function detectZodiacSigns(
  title = "",
  tags: string[] = [],
  description = ""
): ZodiacSign[] {
  const text = ` ${[title, ...tags, description]
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

  return ZODIAC_SIGNS.filter((sign) =>
    text.includes(` ${sign.toLowerCase()} `)
  );
}

function mapProduct(p: PrintifyProduct): UiProduct {
  const variants = p.variants ?? [];

  const variant =
    variants.find(
      (v) =>
        v.is_default &&
        v.is_enabled !== false &&
        v.is_available !== false
    ) ??
    variants.find(
      (v) =>
        v.is_enabled !== false &&
        v.is_available !== false
    ) ??
    variants.find((v) => v.is_enabled !== false) ??
    null;

  const image =
    p.images?.find((i) => i.is_default)?.src ??
    p.images?.[0]?.src ??
    "";

  const tags = Array.isArray(p.tags)
    ? p.tags.map(String)
    : [];

  return {
    id: String(p.id),
    name: p.title || "Zodiac Product",
    price: variant ? variant.price / 100 : 0,
    variantId: variant?.id ?? null,
    size: variant?.title || "Default",
    image,
    description: p.description ?? "",
    tags,
    signs: detectZodiacSigns(
      p.title,
      tags,
      p.description
    ),
  };
}

function extractProducts(data: unknown): PrintifyProduct[] {
  if (Array.isArray(data)) {
    return data as PrintifyProduct[];
  }

  if (!data || typeof data !== "object") {
    return [];
  }

  const obj = data as Record<string, unknown>;

  if (Array.isArray(obj.products)) {
    return obj.products as PrintifyProduct[];
  }

  if (Array.isArray(obj.data)) {
    return obj.data as PrintifyProduct[];
  }

  return [];
}

function nextPageFromResponse(
  data: unknown,
  page: number,
  count: number
): number | null {
  if (!data || typeof data !== "object") {
    return count >= PAGE_SIZE ? page + 1 : null;
  }

  const obj = data as Record<string, unknown>;

  if (obj.has_more === false) return null;

  if (typeof obj.next_page === "number") {
    return obj.next_page > page
      ? obj.next_page
      : null;
  }

  if (typeof obj.last_page === "number") {
    return page < obj.last_page
      ? page + 1
      : null;
  }

  if (typeof obj.total === "number") {
    return page * PAGE_SIZE < obj.total
      ? page + 1
      : null;
  }

  if (obj.has_more === true) return page + 1;

  return count >= PAGE_SIZE ? page + 1 : null;
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);

  async function subscribe() {
    if (!email.trim()) {
      setStatus("Enter your email address.");
      return;
    }

    setLoading(true);
    setStatus("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) throw new Error();

      setEmail("");
      setStatus("You're subscribed!");
    } catch {
      setStatus("Unable to subscribe right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <h3 className="text-sm font-bold">
        Join the Zodiac List
      </h3>
      <p className="mt-1 text-xs text-gray-500">
        New arrivals and exclusive offers.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email address"
        className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
      <button
        type="button"
        disabled={loading}
        onClick={subscribe}
        className="mt-2 w-full rounded-lg bg-black px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Subscribe"}
      </button>
      {status && (
        <p className="mt-2 text-xs text-gray-600">
          {status}
        </p>
      )}
    </div>
  );
}

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

  const { currency, setCurrency, format } = useCurrency();

  const [products, setProducts] = useState<UiProduct[]>(
    () =>
      initialProducts
        .filter((p) => p?.id != null && p?.title)
        .map(mapProduct)
  );

  const [selectedCategory, setSelectedCategory] =
    useState<CategoryName>("Home");

  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] =
    useState(false);
  const [loading, setLoading] = useState(
    initialProducts.length === 0
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [nextPage, setNextPage] = useState<number | null>(1);
  const [visibleCount, setVisibleCount] =
    useState(BATCH_SIZE);
  const [cartMessage, setCartMessage] = useState("");

  const sentinelRef = useRef<HTMLDivElement>(null);
  const fetchingRef = useRef(false);
  const loadedPagesRef = useRef(new Set<number>());

  const fetchProducts = useCallback(
    async (page: number, refresh = false) => {
      if (fetchingRef.current) return;
      if (
        !refresh &&
        loadedPagesRef.current.has(page)
      ) {
        return;
      }

      fetchingRef.current = true;

      if (page === 1) setLoading(true);
      else setLoadingMore(true);

      setError("");

      try {
        const response = await fetch(
          `/api/printify/products?page=${page}&limit=${PAGE_SIZE}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load products (${response.status})`
          );
        }

        const data: unknown = await response.json();
        const raw = extractProducts(data);

        const mapped = raw
          .filter((p) => p?.id != null && p?.title)
          .map(mapProduct);

        setProducts((previous) => {
          const merged = new Map<string, UiProduct>();

          if (!refresh) {
            previous.forEach((p) =>
              merged.set(p.id, p)
            );
          }

          mapped.forEach((p) =>
            merged.set(p.id, p)
          );

          return Array.from(merged.values());
        });

        if (refresh) {
          loadedPagesRef.current.clear();
          setVisibleCount(BATCH_SIZE);
        }

        loadedPagesRef.current.add(page);

        setNextPage(
          nextPageFromResponse(data, page, raw.length)
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load products."
        );
      } finally {
        fetchingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    void fetchProducts(1);
  }, [fetchProducts]);

  const categoryCounts = useMemo(() => {
    const counts = {} as Record<ZodiacSign, number>;

    ZODIAC_SIGNS.forEach((sign) => {
      counts[sign] = products.filter((p) =>
        p.signs.includes(sign)
      ).length;
    });

    return counts;
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return products.filter((p) => {
      const categoryMatch =
        selectedCategory === "Home" ||
        p.signs.includes(selectedCategory);

      const searchMatch =
        !query ||
        [p.name, p.description, ...p.tags]
          .join(" ")
          .toLowerCase()
          .includes(query);

      return categoryMatch && searchMatch;
    });
  }, [products, selectedCategory, searchTerm]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [selectedCategory, searchTerm]);

  const visibleProducts = filteredProducts.slice(
    0,
    visibleCount
  );

  const hasMoreVisible =
    visibleCount < filteredProducts.length;

  useEffect(() => {
    const element = sentinelRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;

        if (hasMoreVisible) {
          setVisibleCount((n) => n + BATCH_SIZE);
        } else if (
          nextPage !== null &&
          !fetchingRef.current
        ) {
          void fetchProducts(nextPage);
        }
      },
      { rootMargin: "500px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [
    hasMoreVisible,
    nextPage,
    fetchProducts,
    filteredProducts.length,
  ]);

  function selectCategory(category: CategoryName) {
    setSelectedCategory(category);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openProductPage(id: string) {
    router.push(`/product/${encodeURIComponent(id)}`);
  }

  function handleAddToCart(product: UiProduct) {
    if (product.variantId === null) {
      openProductPage(product.id);
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

      setCartMessage(`${product.name} added to cart`);
    } catch {
      setCartMessage("Unable to add product to cart.");
    }
  }

  const categoryNavigation = (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => selectCategory("Home")}
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
          onClick={() => selectCategory(sign)}
          className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
            selectedCategory === sign
              ? "bg-black font-semibold text-white"
              : "text-gray-700 hover:bg-gray-100"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="text-lg">
              {SYMBOLS[sign]}
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

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg border px-3 py-2 text-sm lg:hidden"
              aria-label="Open menu"
            >
              ☰
            </button>

            <button
              type="button"
              onClick={() => selectCategory("Home")}
              className="text-left text-lg font-black tracking-tight sm:text-xl"
            >
              Zodiac Datn Shop
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Currency"
              value={currency}
              onChange={(e) =>
                setCurrency(
                  e.target.value as typeof currency
                )
              }
              className="rounded-lg border bg-white px-2 py-2 text-xs"
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
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => router.push("/wishlist")}
              className="px-1 text-xl"
              aria-label={`Wishlist ${wishlist.length} items`}
            >
              {wishlist.length > 0 ? "♥" : "♡"}
            </button>

            <button
              type="button"
              onClick={() => router.push("/cart")}
              className="px-1 text-xl"
              aria-label="Cart"
            >
              🛒
            </button>

            <button
              type="button"
              onClick={() => router.push("/orders")}
              className="hidden px-1 text-xl sm:block"
              aria-label="Orders"
            >
              📦
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-3 pb-3">
          <input
            type="search"
            value={searchTerm}
            onChange={(e) =>
              setSearchTerm(e.target.value)
            }
            placeholder="Search Zodiac Merch..."
            className="w-full rounded-full border border-gray-300 bg-gray-50 px-5 py-3 text-sm outline-none focus:border-black"
          />
        </div>
      </header>

      {/* MOBILE MENU */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="h-full w-72 max-w-[85vw] overflow-y-auto bg-white p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-bold">
                Shop Your Sign
              </h2>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                Close
              </button>
            </div>

            {categoryNavigation}

            <div className="mt-6">
              <NewsletterBox />
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
          <section className="bg-white px-4 py-10 text-center sm:py-14">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
              Wear Your Energy
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
              {selectedCategory === "Home"
                ? "Shop Your Zodiac Sign"
                : `${SYMBOLS[selectedCategory]} ${selectedCategory}`}
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-gray-500">
              {selectedCategory === "Home"
                ? "Discover zodiac inspired fashion made for your sign, your energy, and your style."
                : `${DATES[selectedCategory]} · Discover clothing and accessories inspired by your zodiac sign.`}
            </p>

            {selectedCategory !== "Home" && (
              <button
                type="button"
                onClick={() => selectCategory("Home")}
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
                      onClick={() => selectCategory(sign)}
                      className="rounded-xl border border-gray-200 bg-white px-2 py-4 text-center transition hover:border-black hover:shadow-sm"
                    >
                      <div className="text-3xl">
                        {SYMBOLS[sign]}
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
                  {nextPage !== null
                    ? " · More products may be available"
                    : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => void fetchProducts(1, true)}
                disabled={loading || loadingMore}
                className="rounded-lg border bg-white px-3 py-2 text-xs font-semibold disabled:opacity-50"
              >
                Refresh
              </button>
            </div>

            {/* CART CONFIRMATION */}
            {cartMessage && (
              <div
                role="status"
                className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 text-xs"
              >
                <span>{cartMessage}</span>
                <button
                  type="button"
                  onClick={() => router.push("/cart")}
                  className="shrink-0 font-bold underline"
                >
                  View Cart
                </button>
              </div>
            )}

            {/* ERROR */}
            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p>{error}</p>
                <button
                  type="button"
                  onClick={() =>
                    void fetchProducts(nextPage ?? 1)
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
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
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

            {/* EMPTY RESULTS */}
            {!loading &&
              filteredProducts.length === 0 && (
                <div className="rounded-xl border bg-white px-5 py-12 text-center">
                  <h3 className="text-lg font-bold">
                    No matching products found
                  </h3>
                  <p className="mt-2 text-sm text-gray-500">
                    Try another zodiac sign or search term.
                    Products without zodiac names in their
                    metadata appear under All Products.
                  </p>
                  {nextPage !== null && (
                    <button
                      type="button"
                      disabled={loadingMore}
                      onClick={() =>
                        void fetchProducts(nextPage)
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

                  <button
                    type="button"
                    onClick={() =>
                      openProductPage(product.id)
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

                  <div className="pt-3">
                    {product.signs.length > 0 && (
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
                        {product.signs
                          .map(
                            (sign) =>
                              `${SYMBOLS[sign]} ${sign}`
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

                    <div className="mt-3 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddToCart(product)
                        }
                        className="w-full rounded-lg bg-black px-2 py-2.5 text-xs font-bold text-white transition hover:bg-gray-800"
                      >
                        Add to Cart
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openProductPage(product.id)
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

            {/* INFINITE SCROLL */}
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
                      (count) => count + BATCH_SIZE
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
                    void fetchProducts(nextPage)
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
          <a href="/about">About</a>
          <a href="/contact">Contact</a>
          <a href="/shipping-policy">Shipping</a>
          <a href="/refund-policy">Refunds</a>
          <a href="/privacy-policy">Privacy</a>
          <a href="/terms">Terms</a>
        </div>
      </footer>
    </main>
  );
}
