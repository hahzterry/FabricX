// app/product/[id]/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useCart } from "../../CartContext";
import { useCurrency } from "../../CurrencyContext";
import { useProducts } from "../../ProductsContext";
import {
  ArrowLeftIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import ProductJsonLd from "./JsonLd";
import Image from "next/image";

type ColorSwatch = {
  name: string;
  hex?: string;
};

export default function ProductPage(): React.ReactElement {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const { addItem, toggleWishlist, isInWishlist } = useCart();
  const { currency, setCurrency, format } = useCurrency();
  const { products, loading } = useProducts();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const productIdFromUrl = params.id;

  const product = useMemo(
    () => products.find((p) => String(p.id) === String(productIdFromUrl)) ?? null,
    [products, productIdFromUrl]
  );

  const options = product?.options ?? [];
  const variants = (product?.variants as any[]) ?? [];
  const images = product?.images ?? [];

  const colorOptIndex = useMemo(() => {
    if (!options || !Array.isArray(options)) return -1;
    return options.findIndex((o: any) => {
      const type = o.type?.toLowerCase?.() ?? "";
      const name = o.name?.toLowerCase?.() ?? "";
      return type.includes("color") || name.includes("color");
    });
  }, [options]);

  const sizeOptIndex = useMemo(
    () => options.findIndex((o: any) => o.type?.toLowerCase() === "size" || o.name?.toLowerCase() === "size"),
    [options]
  );

  const { colorById, sizeById } = useMemo(() => {
    const result = {
      colorById: new Map<number, { title: string; hex?: string }>(),
      sizeById: new Map<number, { title: string }>(),
    };
    if (colorOptIndex !== -1) {
      const values = options[colorOptIndex]?.values;
      if (Array.isArray(values)) {
        values.forEach((v: any) => {
          if (!v || typeof v.id !== "number") return;
          const hex = Array.isArray(v.colors) && v.colors.length > 0 ? v.colors[0] : undefined;
          result.colorById.set(v.id, { title: v.title ?? "", hex });
        });
      }
    }
    if (sizeOptIndex !== -1) {
      const values = options[sizeOptIndex]?.values;
      if (Array.isArray(values)) {
        values.forEach((v: any) => {
          if (!v || typeof v.id !== "number") return;
          result.sizeById.set(v.id, { title: v.title ?? "" });
        });
      }
    }
    return result;
  }, [options, colorOptIndex, sizeOptIndex]);

  const colorOptions: ColorSwatch[] = useMemo(() => {
    if (!product || colorOptIndex === -1 || !colorById.size) return [];
    const usedTitles = new Map<string, ColorSwatch>();
    variants.forEach((v: any) => {
      const enabled = v.is_enabled === undefined ? true : v.is_enabled !== false;
      const available = v.is_available === undefined ? true : v.is_available !== false;
      if (!enabled || !available) return;
      const opts = Array.isArray(v.options) ? v.options : [];
      const colorId = opts[colorOptIndex];
      if (typeof colorId !== "number") return;
      const entry = colorById.get(colorId);
      if (!entry) return;
      const title = entry.title?.trim();
      if (!title || usedTitles.has(title)) return;
      usedTitles.set(title, { name: title, hex: entry.hex });
    });
    return Array.from(usedTitles.values());
  }, [product, variants, colorOptIndex, colorById]);

  const sizeOptions: string[] = useMemo(() => {
    if (!product || sizeOptIndex === -1) return [];
    const values = options[sizeOptIndex]?.values;
    if (!Array.isArray(values) || values.length === 0) return [];
    return values.map((v: any) => v.title ?? "");
  }, [product, options, sizeOptIndex]);

  const activeVariant = useMemo(() => {
    if (!product || !variants.length) return null;
    return variants.find((v: any) => {
      const enabled = v.is_enabled === undefined ? true : v.is_enabled !== false;
      const available = v.is_available === undefined ? true : v.is_available !== false;
      if (!enabled || !available) return false;
      const opts = Array.isArray(v.options) ? v.options : [];
      let variantColorTitle: string | null = null;
      if (colorOptIndex !== -1) {
        const colorId = opts[colorOptIndex];
        if (typeof colorId === "number") {
          const entry = colorById.get(colorId);
          if (entry?.title) variantColorTitle = entry.title.trim();
        }
      }
      let variantSizeTitle: string | null = null;
      if (sizeOptIndex !== -1) {
        const sizeId = opts[sizeOptIndex];
        if (typeof sizeId === "number") {
          const entry = sizeById.get(sizeId);
          if (entry?.title) variantSizeTitle = entry.title.trim();
        }
      }
      const colorMatch = selectedColor == null || colorOptIndex === -1 ? true : variantColorTitle === selectedColor;
      const sizeMatch = selectedSize == null || sizeOptIndex === -1 ? true : variantSizeTitle === selectedSize;
      return colorMatch && sizeMatch;
    }) || null;
  }, [product, variants, selectedColor, selectedSize, colorOptIndex, sizeOptIndex, colorById, sizeById]);

  // Related products — same tags, exclude current
  const relatedProducts = useMemo(() => {
    if (!product || products.length === 0) return [];
    const currentTags = new Set((product.tags ?? []).map((t) => t.toLowerCase()));
    return products
      .filter((p) => {
        if (String(p.id) === String(product.id)) return false;
        const pTags = (p.tags ?? []).map((t) => t.toLowerCase());
        return pTags.some((t) => currentTags.has(t));
      })
      .slice(0, 6);
  }, [product, products]);

  if (loading && !product) {
    return (
      <main className="min-h-screen bg-white text-black flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading product...</p>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-white text-black flex flex-col items-center justify-center">
        <p className="mb-4 text-xl">Product not found.</p>
        <button onClick={() => router.push("/")} className="bg-black text-white px-4 py-2 rounded-lg">
          Back to Home
        </button>
      </main>
    );
  }

  const imagesArr = images ?? [];
  const mainImage = imagesArr[selectedImageIndex]?.src ?? "";

  const handleAddToCart = () => {
    if (!selectedSize && sizeOptions.length) { alert("Please select a size."); return; }
    if (!selectedColor && colorOptions.length) { alert("Please select a color."); return; }
    const variant = activeVariant || variants[0];
    if (!variant) { alert("Unable to find variant."); return; }
    addItem({
      id: String(product.id),
      variant_id: variant.id,
      name: product.title,
      price: variant.price != null ? variant.price / 100 : 0,
      size: selectedSize,
      color: selectedColor,
    });
  };

  const handleBuyNow = () => {
  if (!selectedSize && sizeOptions.length) {
    alert("Please select a size.");
    return;
  }
  if (!selectedColor && colorOptions.length) {
    alert("Please select a color.");
    return;
  }
  handleAddToCart();
  router.push("/checkout");
};

  return (
    <main className="min-h-screen bg-white text-black">
      <ProductJsonLd
        id={String(product.id)}
        title={product.title}
        description={product.description ?? ""}
        image={mainImage}
        price={activeVariant ? activeVariant.price / 100 : 0}
      />

      {/* Header */}
      <header className="flex items-center justify-between gap-2 p-3 bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg">
            <ArrowLeftIcon className="h-5 w-5 text-gray-800" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Zodiac Datn Shop</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden md:inline text-xs text-gray-600">Prices in {currency}</span>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as any)}
            className="text-xs border border-gray-300 rounded px-1 py-1 bg-white text-gray-800 max-w-[60px]"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="INR">INR</option>
            <option value="GBP">GBP</option>
            <option value="JPY">JPY</option>
            <option value="AUD">AUD</option>
            <option value="CAD">CAD</option>
            <option value="CHF">CHF</option>
          </select>
        </div>
      </header>

      {/* Product */}
      <section className="max-w-6xl mx-auto p-3 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
        {/* Images */}
        <div>
          <div className="relative bg-white border border-gray-200 rounded-xl p-3 flex items-center justify-center mb-3">
            <button
              onClick={() => toggleWishlist(String(product.id))}
              className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-sm"
              aria-label="Toggle wishlist"
            >
              <span className="text-gray-900 text-xl">
                {isInWishlist(String(product.id)) ? "♥" : "♡"}
              </span>
            </button>
            {mainImage ? (
              <img
                src={mainImage}
                alt={`${product.title} – Zodiac Datn Shop`}
                className="max-h-64 md:max-h-[450px] w-full object-contain rounded"
              />
            ) : (
              <div className="h-48 w-full flex items-center justify-center text-gray-400 text-sm">No image</div>
            )}
          </div>
          {imagesArr.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {imagesArr.map((img, index) => (
                <button
                  key={img.src + index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`border rounded-lg p-1 flex-shrink-0 ${index === selectedImageIndex ? "border-yellow-500" : "border-gray-200"}`}
                >
                  <img src={img.src} alt="" className="h-14 w-14 object-cover rounded" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3">
          <h2 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">{product.title}</h2>

          {activeVariant && (
            <p className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {format(activeVariant.price / 100)}
            </p>
          )}

          {colorOptions.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-2">Color</h3>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color, index) => (
                  <button
                    key={`${color.name}-${index}`}
                    type="button"
                    onClick={() => setSelectedColor(color.name)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-all ${
                      selectedColor === color.name ? "border-black bg-black/5" : "border-gray-300 hover:border-black"
                    }`}
                  >
                    <span
                      className="inline-block h-4 w-4 rounded-full border border-gray-300"
                      style={color.hex ? { backgroundColor: color.hex } : { backgroundColor: "#ccc" }}
                    />
                    {color.name}
                  </button>
                ))}
              </div>
              {selectedColor && <p className="mt-1 text-xs text-green-600">Selected: {selectedColor}</p>}
            </div>
          )}

          {sizeOptions.length > 0 && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base md:text-xl font-semibold text-gray-900">Size</h3>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(true)}
                  className="text-xs px-2 py-1 rounded-full border border-gray-400 text-gray-800 hover:border-black transition-colors"
                >
                  Size guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {sizeOptions.map((size, index) => (
                  <button
                    key={`${size}-${index}`}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      selectedSize === size ? "bg-black text-white border-black" : "bg-white text-gray-900 border-gray-300 hover:border-black"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {selectedSize && <p className="mt-1 text-xs text-green-600">Selected: {selectedSize}</p>}
            </div>
          )}

          <div className="border-t border-gray-200 pt-3">
            <h3 className="text-base md:text-xl font-semibold text-gray-900 mb-1">Product details</h3>
            <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">
              {product.description && product.description.trim().length > 0
                ? product.description
                : `This ${product.title} is part of the VYRA streetwear collection. Premium print-on-demand construction, soft feel, and everyday comfort.`}
            </p>
          </div>

          <div className="border-t border-gray-200 pt-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-lg text-sm font-semibold"
              >
                <ShoppingCartIcon className="h-4 w-4" />
                Add to cart
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 bg-black text-white px-4 py-3 rounded-lg text-sm font-semibold"
              >
                Order now
              </button>
            </div>
          </div>

          {showSizeGuide && (
            <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-lg max-w-sm w-full p-4">
                <h3 className="text-base font-semibold mb-3">Size guide</h3>
                <table className="w-full text-xs text-gray-700 mb-3 border border-gray-200">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1 text-left">Size</th>
                      <th className="border px-2 py-1 text-left">Chest (in)</th>
                      <th className="border px-2 py-1 text-left">Length (in)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[["S","34–36","27"],["M","38–40","28"],["L","42–44","29"],["XL","46–48","30"]].map(([s,c,l]) => (
                      <tr key={s}>
                        <td className="border px-2 py-1">{s}</td>
                        <td className="border px-2 py-1">{c}</td>
                        <td className="border px-2 py-1">{l}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button
                  type="button"
                  onClick={() => setShowSizeGuide(false)}
                  className="w-full bg-black text-white px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related products */}
      {relatedProducts.length > 0 && (
        <section className="max-w-6xl mx-auto px-3 md:px-6 pb-10">
          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 mb-4">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {relatedProducts.map((p) => {
                const relImage = p.images?.find((img: any) => img.is_default)?.src ?? p.images?.[0]?.src ?? "";
                const relPrice = p.variants && p.variants.length > 0 ? (p.variants[0] as any).price / 100 : 0;
                return (
                  <div
                    key={p.id}
                    onClick={() => { router.push(`/product/${p.id}`); setSelectedImageIndex(0); setSelectedSize(null); setSelectedColor(null); }}
                    className="border border-gray-200 p-2 rounded-lg bg-white hover:shadow-md hover:border-black cursor-pointer transition duration-200"
                  >
                    <div className="relative w-full h-24 mb-2 bg-gray-50 rounded overflow-hidden border border-gray-100">
                      {relImage && (
                        <Image
                          src={relImage}
                          alt={p.title}
                          fill
                          className="object-contain"
                          sizes="(max-width: 768px) 50vw, 16vw"
                        />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-gray-900 line-clamp-2 min-h-[2rem]">{p.title}</p>
                    <p className="text-xs font-bold text-gray-800 mt-0.5">{format(relPrice)}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
