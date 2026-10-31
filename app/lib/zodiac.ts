
export const ZODIAC_SIGNS = [
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

export type ZodiacSign = (typeof ZODIAC_SIGNS)[number];

export type ZodiacCategory = ZodiacSign | "Other";

export function getZodiacCategory(product: {
  title?: string;
  tags?: string[];
}): ZodiacCategory {
  const title = (product.title ?? "").toLowerCase();

  // Match the product title first.
  for (const sign of ZODIAC_SIGNS) {
    const regex = new RegExp(`\\b${sign}\\b`, "i");

    if (regex.test(title)) {
      return sign;
    }
  }

  // Only use explicit zodiac tags as a fallback.
  for (const tag of product.tags ?? []) {
    const normalized = tag.trim().toLowerCase();

    const match = ZODIAC_SIGNS.find(
      (sign) => sign.toLowerCase() === normalized
    );

    if (match) return match;
  }

  return "Other";
}

export function getProductsBySign<T extends {
  title?: string;
  tags?: string[];
}>(
  products: T[],
  category: ZodiacCategory
): T[] {
  return products.filter(
    (product) => getZodiacCategory(product) === category
  );
}

export function getZodiacCounts<T extends {
  title?: string;
  tags?: string[];
}>(products: T[]) {
  const categories: ZodiacCategory[] = [
    ...ZODIAC_SIGNS,
    "Other",
  ];

  return Object.fromEntries(
    categories.map((category) => [
      category,
      getProductsBySign(products, category).length,
    ])
  ) as Record<ZodiacCategory, number>;
}
