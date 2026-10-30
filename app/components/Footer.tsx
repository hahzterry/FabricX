"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Footer() {
  const router = useRouter();
  const year = new Date().getFullYear();

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubscribe = async () => {
    if (!email.trim()) {
      setStatus("error");
      setMessage("Please enter your email.");
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
        setMessage(data.error || "Something went wrong.");
        return;
      }

      setStatus("success");
      setMessage("You're subscribed!");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Something went wrong. Please try again.");
    }
  };

  return (
    <footer className="bg-black text-white mt-16">
      <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">

        <div className="col-span-1 sm:col-span-2 md:col-span-1">
          <h2 className="font-[family-name:var(--font-exo2)] text-3xl tracking-tight text-white mb-3">
            Zodiac Datn Shop
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed max-w-[200px]">
            Zodiac merch printed on demand, shipped with intent.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Shop</p>
          <ul className="space-y-3">
            <li><button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-white transition-colors">T-shirts</button></li>
            <li><button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-white transition-colors">Hoodies</button></li>
            <li><button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-white transition-colors">Sweatshirts</button></li>
            <li><button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-white transition-colors">New Arrivals</button></li>
            <li><button onClick={() => router.push("/")} className="text-sm text-gray-400 hover:text-white transition-colors">All Products</button></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Info</p>
          <ul className="space-y-3">
            <li><button onClick={() => router.push("/about")} className="text-sm text-gray-400 hover:text-white transition-colors">About VYRA</button></li>
            <li><button onClick={() => router.push("/blog")} className="text-sm text-gray-400 hover:text-white transition-colors">Blog</button></li>
            <li><button onClick={() => router.push("/contact")} className="text-sm text-gray-400 hover:text-white transition-colors">Contact Us</button></li>
            <li><button onClick={() => router.push("/orders")} className="text-sm text-gray-400 hover:text-white transition-colors">Orders</button></li>
            <li><button onClick={() => router.push("/refund-policy")} className="text-sm text-gray-400 hover:text-white transition-colors">Refund Policy</button></li>
            <li><button onClick={() => router.push("/shipping-policy")} className="text-sm text-gray-400 hover:text-white transition-colors">Shipping Policy</button></li>
            <li><button onClick={() => router.push("/privacy-policy")} className="text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</button></li>
            <li><button onClick={() => router.push("/wishlist")} className="text-sm text-gray-400 hover:text-white transition-colors">Wishlist</button></li>
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Follow</p>
          <ul className="space-y-3">
            <li>
              <a href="https://tiktok.com/@zodiacshirt" target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">
                TikTok
              </a>
            </li>
          </ul>

          <div className="mt-6">
            <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-3">Stay updated</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== "idle") setStatus("idle");
                }}
                placeholder="your@email.com"
                disabled={status === "loading"}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-white transition-colors disabled:opacity-50"
              />
              <button
                onClick={handleSubscribe}
                disabled={status === "loading"}
                className="bg-white text-black px-3 py-2 rounded-md text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {status === "loading" ? "..." : "Go"}
              </button>
            </div>
            {message && (
              <p className={`text-xs mt-2 ${status === "success" ? "text-green-400" : "text-red-400"}`}>
                {message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 px-6 py-4 max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-gray-600">{`© ${year} Zodiac Datn Shop. All rights reserved.`}</p>
        <p className="text-xs text-gray-600">Printed on demand · Shipped worldwide</p>
      </div>
    </footer>
  );
}