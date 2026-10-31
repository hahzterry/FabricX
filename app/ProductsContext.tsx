// app/ProductsContext.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type PrintifyImage = {
  src: string;
  is_default?: boolean;
  position?: string;
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
  values: any[];
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

const ProductsContext = createContext<ProductsContextValue>({
  products: [],
  loading: true,
});

export function ProductsProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<PrintifyProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch("/api/fabricx/products", {
  signal: AbortSignal.timeout(3000),
});
        if (!res.ok) {
          setProducts([]);
          return;
        }
        const json = await res.json();

        const list: PrintifyProduct[] = (json?.data ?? []).map((p: any) => {
          const rawVariants: any[] = Array.isArray(p.variants)
            ? p.variants
            : [];

          // ✅ FIXED — only filter by is_enabled, ignore is_available
          // Printify marks variants as is_available:false even when enabled
          const filteredVariants: PrintifyVariant[] = rawVariants.filter(
            (v: any) => {
              const enabled =
                v.is_enabled === undefined ? true : v.is_enabled !== false;
              return enabled;
            }
          );

          const normalizedOptions: PrintifyOptionType[] = Array.isArray(
            p.options
          )
            ? p.options
            : [];

          const normalizedImages: PrintifyImage[] = Array.isArray(p.images)
            ? p.images.map((img: any) => ({
                src: img.src,
                is_default: img.is_default,
                position: img.position,
              }))
            : [];

          return {
            id: String(p.id),
            title: p.title,
            description: p.description ?? "",
            tags: p.tags ?? [],
            options: normalizedOptions,
            variants: filteredVariants,
            images: normalizedImages,
          };
        });

        setProducts(list);
      } catch (e) {
        console.error(e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <ProductsContext.Provider value={{ products, loading }}>
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
