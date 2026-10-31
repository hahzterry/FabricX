
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import { CurrencyProvider } from "./CurrencyContext";
import { CartProvider } from "./CartContext";
import { ProductsProvider } from "./ProductsContext";

const BASE_URL = "https://shop.zodiacdatn.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),

  title: {
    default:
      "Zodiac DatN Shop | Rep Your Zodiac Sign",
    template: "%s | Zodiac DatN Shop",
  },

  description:
    "Rep your zodiac sign with custom graphic tees, hoodies, tote bags, and more. Zodiac inspired merchandise printed on demand and shipped worldwide.",

  keywords: [
    "zodiac clothing",
    "zodiac shirts",
    "zodiac merchandise",
    "astrology fashion",
    "zodiac hoodies",
    "zodiac tote bags",
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
    "print on demand",
    "personalized zodiac clothing",
  ],

  authors: [
    {
      name: "Zodiac DatN Shop",
      url: BASE_URL,
    },
  ],

  creator: "Zodiac DatN Shop",
  publisher: "Zodiac DatN Shop",

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "Zodiac DatN Shop",
    title:
      "Zodiac DatN Shop | Rep Your Zodiac Sign",
    description:
      "Rep your zodiac sign on all your favorite merch. Shop zodiac inspired clothing and accessories.",
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Zodiac DatN Shop | Rep Your Zodiac Sign",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title:
      "Zodiac DatN Shop | Rep Your Zodiac Sign",
    description:
      "Zodiac inspired clothing and accessories. Printed on demand and shipped worldwide.",
    images: [
      `${BASE_URL}/og-image.jpg`,
    ],
    creator: "@zodiacshirt",
  },

  alternates: {
    canonical: BASE_URL,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta
          name="google-site-verification"
          content="R-YhPaIsZtHPY6_fue0BqKgh4QOYpM0tHYVy6cdptIY"
        />

        <meta
          name="theme-color"
          content="#000000"
        />

        <meta
          name="application-name"
          content="Zodiac DatN Shop"
        />

        <link
          rel="icon"
          href="/favicon.ico"
        />

        <link
          rel="apple-touch-icon"
          href="/apple-touch-icon.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/icon-192.png"
        />

        <link
          rel="icon"
          type="image/png"
          sizes="512x512"
          href="/icon-512.png"
        />
      </head>

      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RQSHXNECHD"
          strategy="afterInteractive"
        />

        <Script
          id="google-analytics"
          strategy="afterInteractive"
        >
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RQSHXNECHD');
          `}
        </Script>

        <CurrencyProvider>
          <CartProvider>
            <ProductsProvider>
              {children}
            </ProductsProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
