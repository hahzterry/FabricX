// app/page.tsx
import { Metadata } from "next";
import HomeClient from "./HomeClient";

export const metadata: Metadata = {
  title: "Zodiac DatN Shop - Zodiac merch.",
  description:
    "Zodiac DatN Shop printed on demand and shipped worldwide to USA, Australia, Canada, and beyond.",
  openGraph: {
    title: "Zodiac Datn Shop - Zodiac everything.",
    description: "Turn your favorite products into zodiac pieces. Worldwide shipping.",
    type: "website",
  },
};

export default function Home() {
  return <HomeClient initialProducts={[]} />;
}
