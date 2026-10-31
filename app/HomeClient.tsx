
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { useProducts } from "./ProductsContext";

import {
  Bars3Icon,
  HomeIcon,
  MagnifyingGlassIcon,
  ShoppingBagIcon,
  HeartIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";

type ZodiacSign =
  | "Aries"
  | "Taurus"
  | "Gemini"
  | "Cancer"
  | "Leo"
  | "Virgo"
  | "Libra"
  | "Scorpio"
  | "Sagittarius"
  | "Capricorn"
  | "Aquarius"
  | "Pisces";

type CategoryName =
  | "All Signs"
  | ZodiacSign
  | "Other Zodiac Merch";

type ZodiacCategory = {
  name: CategoryName;
  symbol: string;
  dates?: string;
};

type UiProduct = {
  id: string;
  name: string;
  price: number;
  zodiacSigns: ZodiacSign[];
  variantId: number | null;
  image: string;
  tags: string[];
};

type Props = {
  initialProducts?: UiProduct[];
};

const PAGE_SIZE = 12;

const zodiacCategories: ZodiacCategory[] = [
  {
    name: "All Signs",
    symbol: "✦",
  },
  {
    name: "Aries",
    symbol: "♈",
    dates: "Mar 21 – Apr 19",
  },
  {
    name: "Taurus",
    symbol: "♉",
    dates: "Apr 20 – May 20",
  },
  {
    name: "Gemini",
    symbol: "♊",
    dates: "May 21 – Jun 20",
  },
  {
    name: "Cancer",
    symbol: "♋",
    dates: "Jun 21 – Jul 22",
  },
  {
    name: "Leo",
    symbol: "♌",
    dates: "Jul 23 – Aug 22",
  },
  {
    name: "Virgo",
    symbol: "♍",
    dates: "Aug 23 – Sep 22",
  },
  {
    name: "Libra",
    symbol: "♎",
    dates: "Sep 23 – Oct 22",
  },
  {
    name: "Scorpio",
    symbol: "♏",
    dates: "Oct 23 – Nov 21",
  },
  {
    name: "Sagittarius",
    symbol: "♐",
    dates: "Nov 22 – Dec 21",
  },
  {
    name: "Capricorn",
    symbol: "♑",
    dates: "Dec 22 – Jan 19",
  },
  {
    name: "Aquarius",
    symbol: "♒",
    dates: "Jan 20 – Feb 18",
  },
  {
    name: "Pisces",
    symbol: "♓",
    dates: "Feb 19 – Mar 20",
  },
  {
    name: "Other Zodiac Merch",
    symbol: "✧",
  },
];

const zodiacSigns: ZodiacSign[] = [
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
];

const infoLinks = [
  {
    label: "About Zodiac DatN Shop",
    path: "/about",
  },
  {
    label: "Blog",
    path: "/blog",
  },
  {
    label: "Contact Us",
    path: "/contact",
  },
  {
    label: "Shipping Policy",
    path: "/shipping-policy",
  },
  {
    label: "Refund Policy",
    path: "/refund-policy",
  },
  {
    label: "Privacy Policy",
    path: "/privacy-policy",
  },
  {
    label: "Terms of Service",
    path: "/terms",
  },
];

function deriveZodiacSigns(
  title: string,
  tags: string[] = []
): ZodiacSign[] {
  const searchableText = [
    title,
    ...tags.map((tag) => String(tag)),
  ].join(" ");

  return zodiacSigns.filter((sign) => {
    const pattern = new RegExp(
      `\\b${sign}\\b`,
      "i"
    );

    return pattern.test(searchableText);
  });
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const [message, setMessage] = useState("");

  async function handleSubscribe() {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email.");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch(
        "/api/newsletter",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setStatus("error");
        setMessage(
          data.error || "Unable to subscribe."
        );
        return;
      }

      setStatus("success");
      setMessage("Subscribed!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Unable to subscribe.");
    }
  }

  return (
    <div className="border-t border-gray-100 mt-5 pt-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">
        Stay Connected
      </p>

      <div className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setStatus("idle");
          }}
          placeholder="Email address"
          disabled={status === "loading"}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-black"
        />

        <button
          type="button"
          onClick={handleSubscribe}
          disabled={status === "loading"}
          className="w-full bg-black text-white rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50"
        >
          {status === "loading"
            ? "Subscribing..."
            : "Subscribe"}
        </button>
      </div>

      {message && (
        <p
          className={`mt-2 text-xs ${
            status === "success"
              ? "text-green-600"
              : "text-red-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}

function SidebarContent({
  selectedCategory,
  onSelectCategory,
  onNavigate,
}: {
  selectedCategory: CategoryName;
  onSelectCategory: (
    category: CategoryName
  ) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <p className="px-2 mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Shop By Zodiac Sign
        </p>

        <div className="space-y-1">
          {zodiacCategories.map((category) => {
            const selected =
              selectedCategory === category.name;

            return (
              <button
                key={category.name}
                type="button"
                onClick={() =>
                  onSelectCategory(category.name)
                }
                className={`w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors ${
                  selected
                    ? "bg-black text-white"
                    : "text-gray-800 hover:bg-gray-100"
                }`}
              >
                <span className="w-7 shrink-0 text-center text-xl leading-none">
                  {category.symbol}
                </span>

                <span className="flex-1 min-w-0">
                  <span className="block text-sm font-semibold">
                    {category.name}
                  </span>

                  {category.dates && (
                    <span
                      className={`block text-[10px] mt-0.5 ${
                        selected
                          ? "text-gray-300"
                          : "text-gray-400"
                      }`}
                    >
                      {category.dates}
                    </span>
                  )}
                </span>

                {selected ? (
                  <span className="text-xs">✓</span>
                ) : (
                  <ChevronRightIcon className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4">
        <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-gray-400">
          Information
        </p>

        <div className="space-y-1">
          {infoLinks.map((link) => (
            <button
              key={link.path}
              type="button"
              onClick={() =>
                onNavigate(link.path)
              }
              className="w-full text-left rounded-lg px-2 py-2 text-xs text-gray-600 hover:bg-gray-100"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>

      <NewsletterBox />
    </div>
  );
}

function ProductImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  if (!src) {
    return (
      <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400 text-xs">
        No Image
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes="(max-width: 768px) 50vw, 25vw"
      className="object-contain transition-transform duration-300 group-hover:scale-105"
    />
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

  const {
    currency,
    setCurrency,
    format,
  } = useCurrency();

  const {
    products: rawProducts,
    loading,
  } = useProducts();

  const [sidebarOpen, setSidebarOpen] =
    useState(true);

  const [
    mobileMenuOpen,
    setMobileMenuOpen,
  ] = useState(false);

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState<CategoryName>("All Signs");

  const [searchTerm, setSearchTerm] =
    useState("");

  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  const loadMoreRef =
    useRef<HTMLDivElement | null>(null);

  const allProducts = useMemo<UiProduct[]>(() => {
    if (rawProducts.length === 0) {
      return initialProducts.map((product) => ({
        ...product,
        zodiacSigns:
          product.zodiacSigns ??
          deriveZodiacSigns(
            product.name,
            product.tags
          ),
      }));
    }

    return rawProducts.map((product) => {
      const images = product.images ?? [];

      const defaultImage =
        images.find(
          (image) => image.is_default
        )?.src ??
        images[0]?.src ??
        "";

      const variants =
        product.variants ?? [];

      const selectedVariant =
        variants.find(
          (variant) =>
            variant.is_default &&
            variant.is_enabled !== false
        ) ??
        variants.find(
          (variant) =>
            variant.is_enabled !== false
        ) ??
        null;

      return {
        id: String(product.id),
        name: product.title,
        price: selectedVariant
          ? selectedVariant.price / 100
          : 0,
        variantId:
          selectedVariant?.id ?? null,
        image: defaultImage,
        tags: product.tags ?? [],
        zodiacSigns: deriveZodiacSigns(
          product.title,
          product.tags ?? []
        ),
      };
    });
  }, [rawProducts, initialProducts]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm
      .trim()
      .toLowerCase();

    return allProducts.filter((product) => {
      const matchesSearch =
        !query ||
        product.name
          .toLowerCase()
          .includes(query) ||
        product.tags.some((tag) =>
          String(tag)
            .toLowerCase()
            .includes(query)
        );

      let matchesCategory = true;

      if (
        selectedCategory ===
        "Other Zodiac Merch"
      ) {
        matchesCategory =
          product.zodiacSigns.length === 0;
      } else if (
        selectedCategory !== "All Signs"
      ) {
        matchesCategory =
          product.zodiacSigns.includes(
            selectedCategory
          );
      }

      return (
        matchesSearch &&
        matchesCategory
      );
    });
  }, [
    allProducts,
    searchTerm,
    selectedCategory,
  ]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, searchTerm]);

  const visibleProducts = useMemo(
    () =>
      filteredProducts.slice(
        0,
        visibleCount
      ),
    [filteredProducts, visibleCount]
  );

  const hasMore =
    visibleCount < filteredProducts.length;

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer =
      new IntersectionObserver(
        (entries) => {
          if (
            entries[0]?.isIntersecting
          ) {
            setVisibleCount(
              (previous) =>
                Math.min(
                  previous + PAGE_SIZE,
                  filteredProducts.length
                )
            );
          }
        },
        {
          rootMargin: "500px 0px",
          threshold: 0,
        }
      );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [
    hasMore,
    filteredProducts.length,
    visibleCount,
  ]);

  function selectCategory(
    category: CategoryName
  ) {
    setSelectedCategory(category);
    setMobileMenuOpen(false);
    setVisibleCount(PAGE_SIZE);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function navigate(path: string) {
    setMobileMenuOpen(false);
    router.push(path);
  }

  function openProduct(id: string) {
    router.push(`/product/${id}`);
  }

  function handleAddToCart(
    product: UiProduct
  ) {
    if (product.variantId === null) {
      openProduct(product.id);
      return;
    }

    addItem({
      id: product.id,
      variant_id: product.variantId,
      name: product.name,
      price: product.price,
      size: "Default",
    });
  }

  function renderProductCard(
    product: UiProduct,
    index: number
  ): ReactNode {
    return (
      <article
        key={product.id}
        className="group relative min-w-0 bg-white border border-gray-200 rounded-xl p-2 md:p-3 hover:border-gray-400 hover:shadow-sm transition-all"
      >
        <button
          type="button"
          aria-label={`View ${product.name}`}
          onClick={() =>
            openProduct(product.id)
          }
          className="block w-full text-left"
        >
          <div className="relative w-full aspect-square bg-gray-50 rounded-lg overflow-hidden">
            <ProductImage
              src={product.image}
              alt={product.name}
              priority={index < 2}
            />
          </div>
        </button>

        <button
          type="button"
          aria-label="Toggle wishlist"
          onClick={() =>
            toggleWishlist(product.id)
          }
          className="absolute right-4 top-4 z-10 bg-white/95 shadow-sm rounded-full p-1.5"
        >
          <HeartIcon
            className={`w-4 h-4 ${
              isInWishlist(product.id)
                ? "fill-red-500 text-red-500"
                : "text-gray-700"
            }`}
          />
        </button>

        <div className="pt-2">
          {product.zodiacSigns.length > 0 && (
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 mb-1 line-clamp-1">
              {product.zodiacSigns.join(" · ")}
            </p>
          )}

          <button
            type="button"
            onClick={() =>
              openProduct(product.id)
            }
            className="text-left w-full"
          >
            <h3 className="text-xs md:text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2rem]">
              {product.name}
            </h3>
          </button>

          <p className="text-sm md:text-base font-bold text-black mt-1">
            {format(product.price)}
          </p>

          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <button
              type="button"
              onClick={() =>
                handleAddToCart(product)
              }
              className="bg-black text-white rounded-md px-1 py-2 text-[10px] md:text-xs font-semibold hover:bg-gray-800"
            >
              Add to Cart
            </button>

            <button
              type="button"
              onClick={() =>
                openProduct(product.id)
              }
              className="border border-black text-black rounded-md px-1 py-2 text-[10px] md:text-xs font-semibold hover:bg-black hover:text-white"
            >
              Order Now
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between gap-2 px-3 md:px-5 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              type="button"
              onClick={() =>
                setMobileMenuOpen(true)
              }
              className="md:hidden p-1.5 rounded-md bg-black text-white"
              aria-label="Open categories"
            >
              <Bars3Icon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                selectCategory("All Signs")
              }
              className="text-left min-w-0"
            >
              <h1 className="text-lg md:text-2xl font-extrabold tracking-tight truncate">
                Zodiac DatN Shop
              </h1>
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <select
              value={currency}
              onChange={(event) =>
                setCurrency(
                  event.target.value as any
                )
              }
              aria-label="Currency"
              className="border border-gray-200 rounded-md bg-white text-xs px-1 py-1.5"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
              <option value="INR">INR</option>
              <option value="JPY">JPY</option>
              <option value="AUD">AUD</option>
              <option value="CAD">CAD</option>
              <option value="CHF">CHF</option>
            </select>

            <button
              type="button"
              onClick={() =>
                navigate("/wishlist")
              }
              aria-label="Wishlist"
              className="relative"
            >
              <HeartIcon className="w-5 h-5" />

              {wishlist.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white rounded-full min-w-4 h-4 px-1 flex items-center justify-center text-[9px]">
                  {wishlist.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/cart")
              }
              aria-label="Cart"
            >
              <ShoppingBagIcon className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() =>
                navigate("/orders")
              }
              aria-label="Orders"
              className="text-xs font-semibold"
            >
              Orders
            </button>
          </div>
        </div>

        <div className="px-3 md:px-5 pb-3">
          <div className="flex items-center gap-2 w-full border border-gray-200 bg-gray-50 rounded-full px-4 py-2">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400" />

            <input
              type="search"
              placeholder="Search zodiac merch..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
              className="flex-1 min-w-0 bg-transparent outline-none text-sm placeholder:text-gray-400"
            />
          </div>
        </div>
      </header>

      {/* MOBILE SIDEBAR */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close menu overlay"
            onClick={() =>
              setMobileMenuOpen(false)
            }
            className="absolute inset-0 bg-black/50"
          />

          <aside className="relative z-10 w-[280px] max-w-[85vw] h-full bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">
              <p className="text-sm font-bold">
                Zodiac Categories
              </p>

              <button
                type="button"
                onClick={() =>
                  setMobileMenuOpen(false)
                }
                aria-label="Close menu"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3">
              <SidebarContent
                selectedCategory={
                  selectedCategory
                }
                onSelectCategory={
                  selectCategory
                }
                onNavigate={navigate}
              />
            </div>
          </aside>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={`hidden md:block shrink-0 bg-white border-r border-gray-200 transition-all duration-200 ${
            sidebarOpen
              ? "w-60"
              : "w-14"
          }`}
        >
          <div className="sticky top-[105px] max-h-[calc(100vh-105px)] overflow-y-auto">
            <div className="p-3">
              <button
                type="button"
                onClick={() =>
                  setSidebarOpen(
                    !sidebarOpen
                  )
                }
                aria-label="Toggle sidebar"
                className="flex items-center justify-center w-8 h-8 bg-black text-white rounded-md"
              >
                {sidebarOpen ? (
                  <ChevronLeftIcon className="w-4 h-4" />
                ) : (
                  <Bars3Icon className="w-4 h-4" />
                )}
              </button>
            </div>

            {sidebarOpen && (
              <div className="px-3 pb-5">
                <SidebarContent
                  selectedCategory={
                    selectedCategory
                  }
                  onSelectCategory={
                    selectCategory
                  }
                  onNavigate={navigate}
                />
              </div>
            )}
          </div>
        </aside>

        {/* PRODUCT CATALOG */}
        <div className="flex-1 min-w-0">
          <section className="p-3 md:p-6">
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500 mb-1">
                Your Sign. Your Style.
              </p>

              <h2 className="text-xl md:text-3xl font-extrabold text-gray-900">
                {selectedCategory ===
                "All Signs"
                  ? "Shop All Zodiac Signs"
                  : selectedCategory ===
                    "Other Zodiac Merch"
                  ? "Other Zodiac Merch"
                  : `${
                      zodiacCategories.find(
                        (category) =>
                          category.name ===
                          selectedCategory
                      )?.symbol ?? ""
                    } ${selectedCategory} Collection`}
              </h2>

              <p className="text-xs md:text-sm text-gray-500 mt-2">
                Discover zodiac inspired
                fashion, gifts and everyday
                essentials.
              </p>

              <div className="flex items-center justify-between mt-4">
                <p className="text-xs text-gray-500">
                  {loading &&
                  allProducts.length === 0
                    ? "Loading products..."
                    : `${filteredProducts.length} products`}
                </p>

                {selectedCategory !==
                  "All Signs" && (
                  <button
                    type="button"
                    onClick={() =>
                      selectCategory(
                        "All Signs"
                      )
                    }
                    className="text-xs font-semibold underline underline-offset-4"
                  >
                    View All Signs
                  </button>
                )}
              </div>
            </div>

            {/* PRODUCT GRID */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
              {visibleProducts.map(
                (product, index) =>
                  renderProductCard(
                    product,
                    index
                  )
              )}
            </div>

            {/* INITIAL LOADING */}
            {loading &&
              allProducts.length === 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-4">
                  {Array.from({
                    length: 8,
                  }).map((_, index) => (
                    <div
                      key={index}
                      className="bg-white border border-gray-200 rounded-xl p-2 animate-pulse"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg" />
                      <div className="h-3 bg-gray-100 rounded mt-3" />
                      <div className="h-3 w-2/3 bg-gray-100 rounded mt-2" />
                    </div>
                  ))}
                </div>
              )}

            {/* EMPTY STATE */}
            {!loading &&
              filteredProducts.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    No products found
                  </p>

                  <p className="text-sm text-gray-500 mt-2">
                    Try another zodiac sign
                    or search term.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm("");
                      selectCategory(
                        "All Signs"
                      );
                    }}
                    className="mt-5 bg-black text-white rounded-lg px-5 py-2 text-xs font-semibold"
                  >
                    Shop All Signs
                  </button>
                </div>
              )}

            {/* INFINITE SCROLL */}
            {hasMore && (
              <div
                ref={loadMoreRef}
                className="py-8 text-center"
              >
                <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-4 h-4 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
                  Loading more products...
                </div>
              </div>
            )}

            {/* PRODUCT COUNT */}
            {!loading &&
              filteredProducts.length > 0 && (
                <div className="text-center py-5">
                  <p className="text-xs text-gray-500">
                    Showing{" "}
                    {visibleProducts.length} of{" "}
                    {filteredProducts.length}{" "}
                    products
                  </p>

                  {!hasMore && (
                    <p className="text-xs text-gray-400 mt-2">
                      You've reached the end
                      of this collection.
                    </p>
                  )}
                </div>
              )}
          </section>
        </div>
      </div>
    </main>
  );
}
