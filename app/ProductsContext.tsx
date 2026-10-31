
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type PrintifyImage = {
  src: string;
  is_default?: boolean;
  position?: string;
  variant_ids?: number[];
};

export type PrintifyVariant = {
  id: number;
  sku: string;
  title: string;
  price: number;
  is_available?: boolean;
  is_default?: boolean;
  is_enabled?: boolean;
  options: number[];
};

export type PrintifyOptionType = {
  name: string;
  type: string;
  values: Array<{
    id: number;
    title: string;
    colors?: string[];
  }>;
};

export type PrintifyProduct = {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  options?: PrintifyOptionType[];
  variants?: PrintifyVariant[];
  images?: PrintifyImage[];
};

type ProductsContextValue = {
  products: PrintifyProduct[];
  loading: boolean;
};

const ProductsContext = createContext<
  ProductsContextValue | undefined
>(undefined);

const PAGE_LIMIT = 50;
const MAX_PAGES = 100;

function normalizeProduct(
  raw: Record<string, any>
): PrintifyProduct {
  const variants: PrintifyVariant[] = Array.isArray(
    raw.variants
  )
    ? raw.variants
        .filter(
          (variant: any) =>
            variant.is_enabled !== false
        )
        .map((variant: any) => ({
          id: Number(variant.id),
          sku: String(variant.sku ?? ""),
          title: String(variant.title ?? ""),
          price: Number(variant.price ?? 0),
          is_available: variant.is_available,
          is_default: variant.is_default,
          is_enabled: variant.is_enabled,
          options: Array.isArray(variant.options)
            ? variant.options.map(Number)
            : [],
        }))
    : [];

  const images: PrintifyImage[] = Array.isArray(
    raw.images
  )
    ? raw.images
        .filter(
          (image: any) =>
            typeof image.src === "string"
        )
        .map((image: any) => ({
          src: image.src,
          is_default: image.is_default,
          position: image.position,
          variant_ids: Array.isArray(
            image.variant_ids
          )
            ? image.variant_ids.map(Number)
            : [],
        }))
    : [];

  const options: PrintifyOptionType[] =
    Array.isArray(raw.options)
      ? raw.options.map((option: any) => ({
          name: String(option.name ?? ""),
          type: String(option.type ?? ""),
          values: Array.isArray(option.values)
            ? option.values.map((value: any) => ({
                id: Number(value.id),
                title: String(value.title ?? ""),
                colors: Array.isArray(
                  value.colors
                )
                  ? value.colors
                  : [],
              }))
            : [],
        }))
      : [];

  return {
    id: String(raw.id),
    title: String(raw.title ?? ""),
    description: String(
      raw.description ?? ""
    ),
    tags: Array.isArray(raw.tags)
      ? raw.tags.filter(
          (tag: unknown): tag is string =>
            typeof tag === "string"
        )
      : [],
    options,
    variants,
    images,
  };
}

export function ProductsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [products, setProducts] = useState<
    PrintifyProduct[]
  >([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      setLoading(true);

      const productMap = new Map<
        string,
        PrintifyProduct
      >();

      try {
        for (
          let page = 1;
          page <= MAX_PAGES;
          page++
        ) {
          const response = await fetch(
            `/api/printify/products?page=${page}&limit=${PAGE_LIMIT}`,
            {
              method: "GET",
              cache: "no-store",
              signal: controller.signal,
            }
          );

          if (!response.ok) {
            throw new Error(
              `Printify products API returned ${response.status} on page ${page}`
            );
          }

          const json = await response.json();

          const rawProducts = Array.isArray(
            json.data
          )
            ? json.data
            : [];

          for (const raw of rawProducts) {
            if (!raw?.id) continue;

            const product =
              normalizeProduct(raw);

            productMap.set(
              product.id,
              product
            );
          }

          if (!controller.signal.aborted) {
            setProducts(
              Array.from(productMap.values())
            );
          }

          const currentPage = Number(
            json.current_page ?? page
          );

          const lastPage = Number(
            json.last_page ?? page
          );

          const hasMore =
            typeof json.has_more === "boolean"
              ? json.has_more
              : currentPage < lastPage;

          if (
            !hasMore ||
            rawProducts.length === 0
          ) {
            break;
          }
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error(
            "Zodiac Datn product loading error:",
            error
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProducts();

    return () => {
      controller.abort();
    };
  }, []);

  return (
    <ProductsContext.Provider
      value={{
        products,
        loading,
      }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts(): ProductsContextValue {
  const context = useContext(
    ProductsContext
  );

  if (!context) {
    throw new Error(
      "useProducts must be used inside ProductsProvider."
    );
  }

  return context;
}
