"use client";

import { useRouter } from "next/navigation";

export default function AboutPage(): React.ReactElement {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="flex items-center justify-between p-4 bg-white border-b border-gray-200 shadow-sm">
        <button
          onClick={() => router.push("/")}
          className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm hover:border-black transition-colors"
        >
          Back
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Zodiac Datn Shop</h1>
        <div className="w-20" />
      </header>

      <section className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">
          Our Story
        </p>
        <h2 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Wear Your Sign
        </h2>
        <p className="text-gray-500 text-lg leading-relaxed">
          Zodiac Datn Shop was built for people who want to wear their sign with pride.
          We turn the twelve zodiac signs into wearable pieces — from tees and hoodies to
          accessories — all printed on demand, shipped worldwide, and designed to last
          beyond the season.
        </p>
      </section>

      <div className="border-t border-gray-100" />

      <section className="max-w-5xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        {[
          {
            icon: "♈",
            title: "All Zodiac Signs",
            desc: "Aries to Pisces — every sign gets its own collection. Find the merch that matches your energy.",
          },
          {
            icon: "📦",
            title: "Printed On Demand",
            desc: "We only print what's ordered. No waste, no overstock — just your zodiac piece, made for you.",
          },
          {
            icon: "🌍",
            title: "Ships Worldwide",
            desc: "Wherever you are, Zodiac Datn Shop ships to you. Global reach, cosmic feel.",
          },
        ].map((item) => (
          <div key={item.title} className="text-center space-y-3">
            <div className="text-4xl">{item.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </section>

      <div className="border-t border-gray-100" />

      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">
          Mission
        </p>
        <p className="text-2xl font-semibold text-gray-800 leading-relaxed">
          "To make zodiac-inspired merch accessible to everyone — no middlemen,
          no markups, just quality pieces printed on demand and shipped straight to your door."
        </p>
      </section>

      <div className="border-t border-gray-100" />

      <section className="max-w-3xl mx-auto px-6 py-16 text-center">
        <p className="text-xs tracking-widest uppercase text-gray-400 mb-4">
          Get In Touch
        </p>
        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          Questions? We're here.
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Reach out anytime — we usually reply within 24 hours.
        </p>
        <button
          onClick={() => window.location.href = "mailto:vyrastore07@gmail.com"}
          className="inline-block bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold transition-colors"
        >
          hahz5d@pm.me
        </button>
      </section>

      <footer className="border-t border-gray-200 p-6 text-center text-xs text-gray-400">
        2025 Zodiac Datn Shop. All rights reserved.
      </footer>
    </main>
  );
}