
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "../../CartContext";
import { useCurrency } from "../../CurrencyContext";
import { useProducts } from "../../ProductsContext";
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import ProductJsonLd from "./JsonLd";

type PrintifyOptionValue = {
  id: number;
  title: string;
  colors?: string[];
};

type PrintifyOption = {
  name: string;
  type?: string;
  values?: PrintifyOptionValue[];
};

type PrintifyVariant = {
  id: number;
  price: number;
  title?: string;
  options?: number[];
  is_enabled?: boolean;
  is_available?: boolean;
  is_default?: boolean;
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
  options?: PrintifyOption[];
  variants?: PrintifyVariant[];
  images?: PrintifyImage[];
};

type ColorSwatch = {
  name: string;
  hex?: string;
};

function isAvailable(variant: PrintifyVariant) {
  return (
    variant.is_enabled !== false &&
    variant.is_available !== false
  );
}

function stripHtml(value: string) {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ProductPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ id: string }>();

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

  const { products: contextProducts } = useProducts();

  const productId = String(params.id || "");

  const [product, setProduct] =
    useState<PrintifyProduct | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedImageIndex, setSelectedImageIndex] =
    useState(0);

  const [selectedSize, setSelectedSize] =
    useState<string | null>(null);

  const [selectedColor, setSelectedColor] =
    useState<string | null>(null);

  const [showSizeGuide, setShowSizeGuide] =
    useState(false);

  const [cartMessage, setCartMessage] = useState("");

  /* =======================================================
     FETCH PRODUCT DIRECTLY BY ID
  ======================================================= */

  const loadProduct = useCallback(
    async (signal?: AbortSignal) => {
      if (!productId) {
        setError("Invalid product ID.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setProduct(null);
      setSelectedImageIndex(0);
      setSelectedSize(null);
      setSelectedColor(null);
      setCartMessage("");

      try {
        const response = await fetch(
          `/api/printify/products/${encodeURIComponent(productId)}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error || "Unable to load product."
          );
        }

        if (!data?.id || !data?.title) {
          throw new Error("Invalid product data received.");
        }

        if (signal?.aborted) return;

        setProduct(data as PrintifyProduct);
      } catch (err) {
        if (signal?.aborted) return;

        console.error("Product loading error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load product."
        );
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [productId]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadProduct(controller.signal);

    return () => controller.abort();
  }, [loadProduct]);

  /* =======================================================
     PRODUCT OPTIONS
  ======================================================= */

  const options = useMemo(
    () => product?.options ?? [],
    [product]
  );

  const variants = useMemo(
    () => product?.variants ?? [],
    [product]
  );

  const images = useMemo(
    () => product?.images ?? [],
    [product]
  );

  const colorOptIndex = useMemo(() => {
    return options.findIndex((option) => {
      const name = option.name?.toLowerCase() ?? "";
      const type = option.type?.toLowerCase() ?? "";

      return (
        name.includes("color") ||
        name.includes("colour") ||
        type.includes("color") ||
        type.includes("colour")
      );
    });
  }, [options]);

  const sizeOptIndex = useMemo(() => {
    return options.findIndex((option) => {
      const name = option.name?.toLowerCase() ?? "";
      const type = option.type?.toLowerCase() ?? "";

      return (
        name.includes("size") ||
        type.includes("size")
      );
    });
  }, [options]);

  const { colorById, sizeById } = useMemo(() => {
    const colors = new Map<
      number,
      { title: string; hex?: string }
    >();

    const sizes = new Map<
      number,
      { title: string }
    >();

    if (colorOptIndex !== -1) {
      const values =
        options[colorOptIndex]?.values ?? [];

      for (const value of values) {
        colors.set(value.id, {
          title: value.title,
          hex: value.colors?.[0],
        });
      }
    }

    if (sizeOptIndex !== -1) {
      const values =
        options[sizeOptIndex]?.values ?? [];

      for (const value of values) {
        sizes.set(value.id, {
          title: value.title,
        });
      }
    }

    return {
      colorById: colors,
      sizeById: sizes,
    };
  }, [options, colorOptIndex, sizeOptIndex]);

  /* =======================================================
     AVAILABLE COLORS
  ======================================================= */

  const colorOptions = useMemo(() => {
    if (colorOptIndex === -1) {
      return [] as ColorSwatch[];
    }

    const used = new Map<string, ColorSwatch>();

    for (const variant of variants) {
      if (!isAvailable(variant)) continue;

      const colorId =
        variant.options?.[colorOptIndex];

      if (colorId === undefined) continue;

      const color = colorById.get(colorId);

      if (!color?.title) continue;

      used.set(color.title, {
        name: color.title,
        hex: color.hex,
      });
    }

    return Array.from(used.values());
  }, [variants, colorOptIndex, colorById]);

  /* =======================================================
     AVAILABLE SIZES
  ======================================================= */

  const sizeOptions = useMemo(() => {
    if (sizeOptIndex === -1) {
      return [] as string[];
    }

    const used = new Set<string>();

    for (const variant of variants) {
      if (!isAvailable(variant)) continue;

      const sizeId =
        variant.options?.[sizeOptIndex];

      if (sizeId === undefined) continue;

      const size = sizeById.get(sizeId);

      if (size?.title) {
        used.add(size.title);
      }
    }

    return Array.from(used);
  }, [variants, sizeOptIndex, sizeById]);

  /* =======================================================
     ACTIVE VARIANT
  ======================================================= */

  const activeVariant = useMemo(() => {
    const availableVariants =
      variants.filter(isAvailable);

    if (availableVariants.length === 0) {
      return null;
    }

    const matches = availableVariants.filter(
      (variant) => {
        const variantOptions = variant.options ?? [];

        let colorMatches = true;
        let sizeMatches = true;

        if (
          selectedColor &&
          colorOptIndex !== -1
        ) {
          const colorId =
            variantOptions[colorOptIndex];

          const color =
            colorId === undefined
              ? undefined
              : colorById.get(colorId);

          colorMatches =
            color?.title === selectedColor;
        }

        if (
          selectedSize &&
          sizeOptIndex !== -1
        ) {
          const sizeId =
            variantOptions[sizeOptIndex];

          const size =
            sizeId === undefined
              ? undefined
              : sizeById.get(sizeId);

          sizeMatches =
            size?.title === selectedSize;
        }

        return colorMatches && sizeMatches;
      }
    );

    return (
      matches.find((variant) => variant.is_default) ??
      matches[0] ??
      null
    );
  }, [
    variants,
    selectedColor,
    selectedSize,
    colorOptIndex,
    sizeOptIndex,
    colorById,
    sizeById,
  ]);

  /* =======================================================
     RELATED PRODUCTS
  ======================================================= */

  const relatedProducts = useMemo(() => {
    if (!product) return [];

    const currentTags = new Set(
      (product.tags ?? []).map((tag) =>
        tag.toLowerCase()
      )
    );

    if (currentTags.size === 0) return [];

    return (contextProducts as PrintifyProduct[])
      .filter((item) => {
        if (
          String(item.id) === String(product.id)
        ) {
          return false;
        }

        return (item.tags ?? []).some((tag) =>
          currentTags.has(tag.toLowerCase())
        );
      })
      .slice(0, 6);
  }, [product, contextProducts]);

  /* =======================================================
     CART ACTIONS
  ======================================================= */

  function handleAddToCart(): boolean {
    if (!product) return false;

    if (
      sizeOptions.length > 0 &&
      !selectedSize
    ) {
      setCartMessage("Please select a size.");
      return false;
    }

    if (
      colorOptions.length > 0 &&
      !selectedColor
    ) {
      setCartMessage("Please select a color.");
      return false;
    }

    if (!activeVariant) {
      setCartMessage(
        "This combination is currently unavailable."
      );
      return false;
    }

    try {
      addItem({
        id: String(product.id),
        variant_id: activeVariant.id,
        name: product.title,
        price: activeVariant.price / 100,
        size: selectedSize,
        color: selectedColor,
      });

      setCartMessage("Added to cart successfully.");
      return true;
    } catch (err) {
      console.error("Add to cart error:", err);

      setCartMessage("Unable to add product to cart.");
      return false;
    }
  }

  function handleBuyNow() {
    const added = handleAddToCart();

    if (added) {
      router.push("/checkout");
    }
  }

  /* =======================================================
     SHARED STORE HEADER

     Matches the homepage:
     Store name, currency, wishlist, cart.
  ======================================================= */

  const storeHeader = (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="shrink-0 rounded-lg border border-black px-3 py-2 text-sm"
            aria-label="Go back"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="truncate text-left text-lg font-black tracking-tight sm:text-xl"
          >
            Zodiac Datn Shop
          </button>
        </div>

        <div className="flex shrink-0 items-center gap-2">
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
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => router.push("/wishlist")}
            className="px-1 text-xl"
            aria-label={`Wishlist: ${wishlist.length} items`}
          >
            {wishlist.length > 0 ? "♥" : "♡"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/cart")}
            className="px-1 text-xl"
            aria-label="Shopping cart"
          >
            🛒
          </button>
        </div>
      </div>
    </header>
  );

  /* =======================================================
     LOADING AND ERROR STATES
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-white text-black">
        {storeHeader}

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
            <p className="text-sm text-gray-600">
              Loading product...
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-black">
        {storeHeader}

        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-3 text-xl font-bold">
            Unable to load product
          </h1>

          <p className="mb-5 max-w-sm text-sm text-gray-500">
            {error || "Product not found."}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => void loadProduct()}
              className="rounded-lg border border-black px-5 py-3 text-sm font-bold"
            >
              Retry
            </button>

            <button
              type="button"
              onClick={() => router.push("/")}
              className="rounded-lg bg-black px-5 py-3 text-sm font-bold text-white"
            >
              Back to Shop
            </button>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PRODUCT DISPLAY
  ======================================================= */

  const mainImage =
    images[selectedImageIndex]?.src ??
    images[0]?.src ??
    "";

  const displayPrice =
    activeVariant?.price ??
    variants.find(isAvailable)?.price ??
    0;

  return (
    <main className="min-h-screen bg-white text-black">
      <ProductJsonLd
        id={String(product.id)}
        title={product.title}
        description={product.description ?? ""}
        image={mainImage}
        price={displayPrice / 100}
      />

      {storeHeader}

      {/* PRODUCT CONTENT */}
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-6 p-3 md:grid-cols-2 md:gap-10 md:p-6">
        {/* PRODUCT IMAGES */}
        <div>
          <div className="relative mb-3 flex items-center justify-center rounded-xl border border-gray-200 bg-white p-3">
            <button
              type="button"
              onClick={() =>
                toggleWishlist(String(product.id))
              }
              className="absolute right-2 top-2 z-10 rounded-full bg-white/90 p-2 shadow-sm"
              aria-label="Toggle wishlist"
            >
              <span className="text-xl">
                {isInWishlist(String(product.id))
                  ? "♥"
                  : "♡"}
              </span>
            </button>

            {mainImage ? (
              <img
                src={mainImage}
                alt={product.title}
                className="max-h-64 w-full rounded object-contain md:max-h-[450px]"
              />
            ) : (
              <div className="flex h-48 w-full items-center justify-center text-sm text-gray-400">
                Image unavailable
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((image, index) => (
                <button
                  key={`${image.src}-${index}`}
                  type="button"
                  onClick={() =>
                    setSelectedImageIndex(index)
                  }
                  className={`shrink-0 rounded-lg border p-1 ${
                    index === selectedImageIndex
                      ? "border-black"
                      : "border-gray-200"
                  }`}
                >
                  <img
                    src={image.src}
                    alt={`${product.title} view ${index + 1}`}
                    className="h-14 w-14 rounded object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* PRODUCT DETAILS */}
        <div className="space-y-4">
          <h1 className="text-xl font-bold leading-tight text-gray-900 md:text-3xl">
            {product.title}
          </h1>

          <p className="text-2xl font-extrabold text-gray-900 md:text-3xl">
            {format(displayPrice / 100)}
          </p>

          {/* COLORS */}
          {colorOptions.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <h2 className="mb-3 text-base font-semibold md:text-xl">
                Color
              </h2>

              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => {
                      setSelectedColor(color.name);
                      setCartMessage("");
                    }}
                    className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs ${
                      selectedColor === color.name
                        ? "border-black bg-gray-100 font-bold"
                        : "border-gray-300"
                    }`}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-gray-300"
                      style={{
                        backgroundColor:
                          color.hex || "#ccc",
                      }}
                    />
                    {color.name}
                  </button>
                ))}
              </div>

              {selectedColor && (
                <p className="mt-2 text-xs text-green-700">
                  Selected: {selectedColor}
                </p>
              )}
            </div>
          )}

          {/* SIZES */}
          {sizeOptions.length > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-base font-semibold md:text-xl">
                  Size
                </h2>

                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="rounded-full border border-gray-400 px-3 py-1 text-xs"
                >
                  Size guide
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setSelectedSize(size);
                      setCartMessage("");
                    }}
                    className={`rounded-full border px-4 py-2 text-xs font-medium ${
                      selectedSize === size
                        ? "border-black bg-black text-white"
                        : "border-gray-300 bg-white text-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>

              {selectedSize && (
                <p className="mt-2 text-xs text-green-700">
                  Selected: {selectedSize}
                </p>
              )}
            </div>
          )}

          {/* DESCRIPTION */}
          <div className="border-t border-gray-200 pt-4">
            <h2 className="mb-2 text-base font-semibold md:text-xl">
              Product details
            </h2>

            <p className="whitespace-pre-line text-sm leading-relaxed text-gray-700">
              {product.description
                ? stripHtml(product.description)
                : "Discover this exclusive Zodiac Datn Shop product, made for everyday style and comfort."}
            </p>
          </div>

          {/* CART FEEDBACK */}
          {cartMessage && (
            <div
              role="status"
              className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{cartMessage}</span>

                {cartMessage ===
                  "Added to cart successfully." && (
                  <button
                    type="button"
                    onClick={() => router.push("/cart")}
                    className="font-bold underline"
                  >
                    View Cart
                  </button>
                )}
              </div>
            </div>
          )}

          {/* CART BUTTONS */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => handleAddToCart()}
                disabled={!activeVariant}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!activeVariant}
                className="flex-1 rounded-lg bg-black px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                Order Now
              </button>
            </div>

            {!activeVariant && (
              <p className="mt-3 text-xs text-red-600">
                This product or variant is currently unavailable.
              </p>
            )}
          </div>

          {/* SIZE GUIDE */}
          {showSizeGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Size guide"
                className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg"
              >
                <h3 className="mb-3 text-lg font-bold">
                  Size guide
                </h3>

                <p className="mb-4 text-sm text-gray-600">
                  Sizing varies by product. Check the product
                  description or contact us for exact
                  measurements.
                </p>

                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="w-full rounded-lg bg-black px-4 py-3 text-sm font-bold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section className="mx-auto max-w-6xl px-3 pb-10 md:px-6">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="mb-4 text-lg font-extrabold md:text-2xl">
              You May Also Like
            </h2>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
              {relatedProducts.map((item) => {
                const image =
                  item.images?.find(
                    (img) => img.is_default
                  )?.src ??
                  item.images?.[0]?.src ??
                  "";

                const variant =
                  item.variants?.find(isAvailable);

                return (
                  <button
                    key={String(item.id)}
                    type="button"
                    onClick={() => {
                      router.push(
                        `/product/${encodeURIComponent(String(item.id))}`
                      );
                    }}
                    className="rounded-lg border border-gray-200 bg-white p-2 text-left transition hover:border-black hover:shadow-md"
                  >
                    <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded bg-gray-50">
                      {image ? (
                        <img
                          src={image}
                          alt={item.title}
                          loading="lazy"
                          className="h-full w-full object-contain"
                        />
                      ) : (
                        <span className="text-xs text-gray-400">
                          No image
                        </span>
                      )}
                    </div>

                    <p className="line-clamp-2 min-h-8 text-xs font-semibold">
                      {item.title}
                    </p>

                    <p className="mt-2 text-xs font-bold">
                      {format(
                        (variant?.price ?? 0) / 100
                      )}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
