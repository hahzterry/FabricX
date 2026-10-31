
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

export function ProductsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [products, setProducts] =
    useState<PrintifyProduct[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        // No 3-second timeout.
        const res = await fetch(
          "/api/fabricx/products"
        );

        if (!res.ok) {
          throw new Error(
            `Products API returned ${res.status}`
          );
        }

        const json = await res.json();

        const list: PrintifyProduct[] = (
          json?.data ?? []
        ).map((p: any) => {
          const rawVariants: any[] =
            Array.isArray(p.variants)
              ? p.variants
              : [];

          // Preserve original FabricX variant filtering.
          const filteredVariants: PrintifyVariant[] =
            rawVariants.filter((v: any) => {
              return v.is_enabled !== false;
            });

          const normalizedOptions: PrintifyOptionType[] =
            Array.isArray(p.options)
              ? p.options
              : [];

          const normalizedImages: PrintifyImage[] =
            Array.isArray(p.images)
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
      } catch (error) {
        console.error(
          "FabricX product loading error:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <ProductsContext.Provider
      value={{ products, loading }}
    >
      {children}
    </ProductsContext.Provider>
  );
}

export function useProducts() {
  return useContext(ProductsContext);
}
