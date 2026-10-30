"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useCart } from "./CartContext";
import { useCurrency } from "./CurrencyContext";
import { useProducts } from "./ProductsContext";
import {
  RectangleGroupIcon,
  Squares2X2Icon,
  BoltIcon,
  Bars3Icon,
  SparklesIcon,
  UserIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";

type CategoryName =
  | "Home"
  | "T-shirts"
  | "Hoodies"
  | "Sweatshirts"
  | "Tank Tops"
  | "Long Sleeve Shirts"
  | "Polo Shirts"
  | "Leggings"
  | "Shorts"
  | "Dresses & Skirts"
  | "Kids & Baby Clothing";

type Category = { name: CategoryName; icon: React.ReactElement };

type UiProduct = {
  id: string;
  name: string;
  price: number;
  category: CategoryName;
  rating: number;
  reviews: number;
  image: string;
  tags: string[];
};

type Props = { initialProducts?: UiProduct[] };

const categories: Category[] = [
  { name: "Home", icon: <HomeIcon className="h-4 w-4" /> },
  { name: "T-shirts", icon: <RectangleGroupIcon className="h-4 w-4" /> },
  { name: "Hoodies", icon: <Squares2X2Icon className="h-4 w-4" /> },
  { name: "Sweatshirts", icon: <Squares2X2Icon className="h-4 w-4" /> },
  { name: "Tank Tops", icon: <BoltIcon className="h-4 w-4" /> },
  { name: "Long Sleeve Shirts", icon: <RectangleGroupIcon className="h-4 w-4" /> },
  { name: "Polo Shirts", icon: <RectangleGroupIcon className="h-4 w-4" /> },
  { name: "Leggings", icon: <Bars3Icon className="h-4 w-4" /> },
  { name: "Shorts", icon: <Bars3Icon className="h-4 w-4" /> },
  { name: "Dresses & Skirts", icon: <SparklesIcon className="h-4 w-4" /> },
  { name: "Kids & Baby Clothing", icon: <UserIcon className="h-4 w-4" /> },
];

const infoLinks = [
  { label: "About Zodiac Datn Shop", path: "/about", icon: "ℹ️" },
  { label: "Blog", path: "/blog", icon: "✍️" },
  { label: "Contact Us", path: "/contact", icon: "📧" },
  { label: "Shipping Policy", path: "/shipping-policy", icon: "🚚" },
  { label: "Refund Policy", path: "/refund-policy", icon: "↩️" },
  { label: "Privacy Policy", path: "/privacy-policy", icon: "🔒" },
  { label: "Terms of Service", path: "/terms", icon: "📄" },
];

function deriveCategory(title: string, tags: string[] | undefined): CategoryName {
  const lowerTitle = title.toLowerCase();
  const lowerTags = (tags ?? []).map((t) => t.toLowerCase());
  const hasTag = (needle: string) =>
    lowerTags.some((t) => t.includes(needle)) || lowerTitle.includes(needle);
  if (hasTag("hoodie") || hasTag("hooded")) return "Hoodies";
  if (hasTag("sweatshirt")) return "Sweatshirts";
  if (hasTag("tank")) return "Tank Tops";
  if (hasTag("long sleeve")) return "Long Sleeve Shirts";
  if (hasTag("polo")) return "Polo Shirts";
  if (hasTag("legging")) return "Leggings";
  if (hasTag("shorts")) return "Shorts";
  if (hasTag("dress") || hasTag("skirt")) return "Dresses & Skirts";
  if (hasTag("kid") || hasTag("baby") || hasTag("toddler")) return "Kids & Baby Clothing";
  return "T-shirts";
}

function NewsletterBox() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Enter your email");
      return;
    }

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.error || "Something went wrong");
        return;
      }

      setStatus("success");
      setMessage("Subscribed!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="border-t border-gray-100 mt-4 pt-3 px-2">
      <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Stay Updated</p>
      <div className="flex flex-col gap-1.5">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== "idle") setStatus("idle");
          }}
          placeholder="your@email.com"
          disabled={status === "loading"}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs outline-none focus:border-black transition-colors disabled:opacity-50"
        />
        <button
          onClick={handleSubscribe}
          disabled={status === "loading"}
          className="w-full bg-black text-white py-1.5 rounded text-xs font-semibold hover:bg-gray-900 transition-colors disabled:opacity-50"
        >
          {status === "loading" ? "..." : "Subscribe"}
        </button>
      </div>
      {message && (
        <p className={`text-xs mt-1.5 ${status === "success" ? "text-green-600" : "text-red-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

export default function HomeClient({ initialProducts }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryName>("Home");
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const router = useRouter();
  const { addItem, toggleWishlist, isInWishlist, wishlist } = useCart();
  const { currency, setCurrency, format } = useCurrency();
  const { products: rawProducts, loading } = useProducts();

  const allProducts: UiProduct[] = useMemo(() => {
    if (rawProducts.length > 0) {
      return rawProducts.map((p) => {
        const mainImage =
          p.images?.find((img: any) => img.is_default)?.src ??
          p.images?.[0]?.src ??
          "https://via.placeholder.com/200";
        return {
          id: String(p.id),
          name: p.title,
          price: p.variants && p.variants.length > 0 ? (p.variants[0] as any).price / 100 : 30,
          category: deriveCategory(p.title, p.tags),
          rating: 4.5,
          reviews: 128,
          image: mainImage,
          tags: p.tags ?? [],
        };
      });
    }
    return initialProducts ?? [];
  }, [rawProducts, initialProducts]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Home" || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [allProducts, searchTerm, selectedCategory]);

  const handleAddToCart = (p: UiProduct) => {
    addItem({ id: p.id, variant_id: 0, name: p.name, price: p.price, size: "Default" });
  };

  const openProductPage = (id: string) => router.push(`/product/${id}`);

  if (loading && allProducts.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 text-black">
        <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 w-full">
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gray-200 rounded animate-pulse" />
              <div className="w-16 h-5 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="flex items-center gap-2">
              <div className="w-16 h-7 bg-gray-200 rounded animate-pulse" />
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
              <div className="w-7 h-7 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="px-3 pb-2">
            <div className="w-full h-8 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </header>
        <div className="p-3">
          <div className="w-40 h-5 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="w-64 h-3 bg-gray-100 rounded animate-pulse mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border border-gray-100 p-2 rounded-lg bg-white animate-pulse">
                <div className="w-full h-28 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-1" />
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/4 mb-2" />
                <div className="flex gap-1">
                  <div className="flex-1 h-7 bg-gray-200 rounded" />
                  <div className="flex-1 h-7 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 text-black">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40 w-full">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1 rounded bg-black text-white text-xs"
            >
              ☰
            </button>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Zodiac Datn Shop</h1>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as any)}
              className="text-xs border border-gray-300 rounded px-1 py-1 bg-white text-gray-800 w-16"
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
            <button onClick={() => router.push("/wishlist")} className="text-lg leading-none" aria-label="Wishlist">
              {wishlist.length > 0 ? "♥" : "♡"}
            </button>
            <button onClick={() => router.push("/cart")} className="text-lg leading-none" aria-label="Cart">🛒</button>
            <button onClick={() => router.push("/orders")} className="text-lg leading-none" aria-label="Orders">📦</button>
          </div>
        </div>
        <div className="px-3 pb-2">
          <div className="flex items-center w-full bg-white border border-gray-300 rounded-full px-3 py-1.5">
            <span className="text-gray-400 mr-1 text-xs">🔍</span>
            <input
              type="text"
              placeholder="Search Zodiac Merch..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder:text-gray-400 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-white w-56 h-full p-3 overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobileMenuOpen(false)} className="mb-3 bg-black text-white px-3 py-1 rounded text-xs w-fit">
              ✕ Close
            </button>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">Categories</p>
            <ul className="space-y-0.5">
              {categories.map((cat) => (
                <li
                  key={cat.name}
                  onClick={() => { setSelectedCategory(cat.name); setMobileMenuOpen(false); }}
                  className={`cursor-pointer text-xs font-medium flex items-center gap-2 py-1.5 px-2 rounded transition-all ${
                    selectedCategory === cat.name ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {cat.icon}
                  <span>{cat.name}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-gray-100 mt-4 pt-3">
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">Info</p>
              <ul className="space-y-0.5">
                {infoLinks.map((item) => (
                  <li
                    key={item.path}
                    onClick={() => { router.push(item.path); setMobileMenuOpen(false); }}
                    className="cursor-pointer text-xs font-medium flex items-center gap-2 py-1.5 px-2 rounded text-gray-600 hover:bg-gray-100"
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <NewsletterBox />
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className={`hidden md:block bg-white border-r border-gray-200 p-4 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? "w-56" : "w-14"}`}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="mb-4 bg-black text-white px-2 py-1 rounded text-sm">
            {sidebarOpen ? "←" : "☰"}
          </button>
          {sidebarOpen && (
            <>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">Categories</p>
              <ul className="space-y-0.5">
                {categories.map((cat) => (
                  <li
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`cursor-pointer text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded transition-all ${
                      selectedCategory === cat.name ? "bg-black text-white" : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.name}</span>
                  </li>
                ))}
              </ul>
              <div className="border-t border-gray-100 mt-4 pt-3">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2 px-2">Info</p>
                <ul className="space-y-0.5">
                  {infoLinks.map((item) => (
                    <li
                      key={item.path}
                      onClick={() => router.push(item.path)}
                      className="cursor-pointer text-sm font-medium flex items-center gap-2 px-2 py-1.5 rounded text-gray-600 hover:bg-gray-100"
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <NewsletterBox />
            </>
          )}
        </aside>

        {/* Main content */}
        <div className="flex-1 w-full">
          <section className="p-3">
            <h2 className="text-lg font-extrabold mb-1 text-gray-900">
              {selectedCategory === "Home" ? "Fresh Picks for You" : selectedCategory}
            </h2>
            <p className="mb-3 text-xs text-gray-600">
              Discover Zodiac Merch: premium T-shirts, hoodies, sweatshirts and more, shipped worldwide.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="group border border-gray-200 p-2 rounded-lg bg-white transition duration-200 hover:shadow-md hover:border-black cursor-pointer relative"
                  onClick={() => openProductPage(p.id)}
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }}
                    className="absolute top-1.5 right-1.5 p-1 rounded-full bg-white/90 shadow-sm z-10"
                    aria-label="Toggle wishlist"
                  >
                    <span className="text-gray-900 text-xs">{isInWishlist(p.id) ? "♥" : "♡"}</span>
                  </button>
                  <div className="mb-1.5 rounded border border-gray-100 overflow-hidden w-full h-28 bg-white relative">
                    <Image
                      src={p.image}
                      alt={`${p.name} by Zodiac Datn Shop`}
                      fill
                      className="object-contain"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <h3 className="font-semibold text-xs text-gray-900 line-clamp-2 min-h-[2rem]">
                    {p.name}
                  </h3>
                  <p className="text-gray-800 font-bold text-sm mt-0.5">{format(p.price)}</p>
                  <p className="text-xs text-gray-400">⭐ {p.rating} · {p.reviews}</p>
                  <div className="flex gap-1 mt-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAddToCart(p); }}
                      className="flex-1 bg-black text-white py-0.5 px-0.5 rounded text-[9px] font-semibold md:py-1.5 md:px-2 md:text-xs"
                    >
                      Add to Cart
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); openProductPage(p.id); }}
                      className="flex-1 bg-black text-white py-0.5 px-0.5 rounded text-[9px] font-semibold md:py-1.5 md:px-2 md:text-xs"
                    >
                      Order Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

