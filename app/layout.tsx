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
    default: "Zodiac DatN Shop - Rep your zodiac sign",
    template: "%s | Zodiac Datn Shop",
  },
  description:
    "Zodiac Datn Show turns your into custom graphic tees, hoodies, and more, printed on demand and shipped worldwide.",
  keywords: [
    "streetwear",
    "print on demand",
    "graphic tees",
    "hoodies",
    "Zodiac Shirt",
    "custom zodic clothing",
    "online fashion store",
    "personalized zodiac clothing",
    "wear love wear memories",
    "independent zodiac brand",
  ],
  authors: [{ name: "VYRA", url: BASE_URL }],
  creator: "VYRA",
  publisher: "VYRA",
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
    siteName: "Zodiac Datn Shop",
    title: "Zodiac Datn Shop - Rep your zodiac sign on all your fav merch.",
    description:
      Zodiac Datn Shop - Rep your zodiac sign on all your fav merch.
    images: [
      {
        url: `${BASE_URL}/og-image.jpg`,
        width: 1200,
        height: 630,
        alt: "Zodiac DatN Shop - Rep your zodiac sign.
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zodiac DatN Shop - Rep your zodiac sign.",
    description:
      "Zodiac DatN Shop - Rep your zodiac sign. Printed on demand, shipped worldwide.",
    images: [`${BASE_URL}/og-image.jpg`],
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
        <link rel="canonical" href={BASE_URL} />
        <meta name="google-site-verification" content="R-YhPaIsZtHPY6_fue0BqKgh4QOYpM0tHYVy6cdptIY" />
        <meta name="theme-color" content="#000000" />
        <meta name="application-name" content="VYRA" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png" />
      </head>
      <body>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-RQSHXNECHD"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RQSHXNECHD');
          `}
        </Script>
        <CurrencyProvider>
          <CartProvider>
            <ProductsProvider>{children}</ProductsProvider>
          </CartProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
