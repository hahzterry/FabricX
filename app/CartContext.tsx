
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  id: string;
  variant_id: number;
  name: string;
  price: number;
  quantity: number;
  size?: string | null;
  color?: string | null;
};

type AddCartItem = Omit<CartItem, "quantity"> & {
  quantity?: number;
};

type CartContextValue = {
  cart: CartItem[];
  addItem: (item: AddCartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (
    id: string,
    quantity: number
  ) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
  cartCount: number;
  hydrated: boolean;
};

const CartContext = createContext<
  CartContextValue | undefined
>(undefined);

const CART_STORAGE_KEY = "fabricx_cart_v1";
const WISHLIST_STORAGE_KEY = "fabricx_wishlist_v1";

export function cartItemKey(
  item: Pick<CartItem, "id" | "variant_id">
): string {
  return `${item.id}:${item.variant_id}`;
}

function normalizeStoredCart(value: unknown): CartItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const items = new Map<string, CartItem>();

  for (const raw of value) {
    if (!raw || typeof raw !== "object") {
      continue;
    }

    const item = raw as Record<string, unknown>;

    const id = String(item.id ?? "");
    const variantId = Number(
      item.variant_id ?? item.variantId
    );
    const price = Number(item.price);
    const quantity = Number(item.quantity ?? 1);

    if (
      !id ||
      !Number.isSafeInteger(variantId) ||
      variantId <= 0 ||
      !Number.isFinite(price) ||
      price < 0 ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      continue;
    }

    const normalized: CartItem = {
      id,
      variant_id: variantId,
      name: String(item.name ?? "Product"),
      price,
      quantity: Math.max(1, Math.floor(quantity)),
      size:
        typeof item.size === "string"
          ? item.size
          : null,
      color:
        typeof item.color === "string"
          ? item.color
          : null,
    };

    const key = cartItemKey(normalized);
    const existing = items.get(key);

    if (existing) {
      items.set(key, {
        ...normalized,
        quantity:
          existing.quantity + normalized.quantity,
      });
    } else {
      items.set(key, normalized);
    }
  }

  return Array.from(items.values());
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  /* =====================================================
     RESTORE SAVED CART AND WISHLIST
  ===================================================== */

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(
        CART_STORAGE_KEY
      );

      const storedWishlist =
        window.localStorage.getItem(
          WISHLIST_STORAGE_KEY
        );

      if (storedCart) {
        setCart(
          normalizeStoredCart(JSON.parse(storedCart))
        );
      }

      if (storedWishlist) {
        const parsed = JSON.parse(storedWishlist);

        if (Array.isArray(parsed)) {
          setWishlist(
            Array.from(
              new Set(
                parsed
                  .filter(
                    (id): id is string =>
                      typeof id === "string"
                  )
              )
            )
          );
        }
      }
    } catch (error) {
      console.error(
        "[Zodiac Datn] Failed to restore cart:",
        error
      );
    } finally {
      setHydrated(true);
    }
  }, []);

  /* =====================================================
     PERSIST CART
  ===================================================== */

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error(
        "[Zodiac Datn] Failed to save cart:",
        error
      );
    }
  }, [cart, hydrated]);

  /* =====================================================
     PERSIST WISHLIST
  ===================================================== */

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error(
        "[Zodiac Datn] Failed to save wishlist:",
        error
      );
    }
  }, [wishlist, hydrated]);

  /* =====================================================
     ADD ITEM
  ===================================================== */

  const addItem = useCallback(
    (item: AddCartItem) => {
      const id = String(item.id);
      const variantId = Number(item.variant_id);
      const price = Number(item.price);
      const quantity = Math.max(
        1,
        Math.floor(Number(item.quantity ?? 1))
      );

      if (!id) {
        throw new Error("Invalid product ID.");
      }

      if (
        !Number.isSafeInteger(variantId) ||
        variantId <= 0
      ) {
        throw new Error(
          "Invalid Printify variant ID."
        );
      }

      if (
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error("Invalid product price.");
      }

      if (
        !Number.isFinite(quantity) ||
        quantity < 1
      ) {
        throw new Error("Invalid quantity.");
      }

      const normalized: CartItem = {
        id,
        variant_id: variantId,
        name: item.name,
        price,
        quantity,
        size: item.size ?? null,
        color: item.color ?? null,
      };

      const key = cartItemKey(normalized);

      setCart((previous) => {
        const existingIndex = previous.findIndex(
          (entry) =>
            cartItemKey(entry) === key
        );

        if (existingIndex >= 0) {
          return previous.map((entry, index) =>
            index === existingIndex
              ? {
                  ...entry,
                  quantity:
                    entry.quantity + quantity,
                }
              : entry
          );
        }

        return [...previous, normalized];
      });
    },
    []
  );

  /* =====================================================
     REMOVE ITEM
  ===================================================== */

  const removeItem = useCallback(
    (key: string) => {
      setCart((previous) =>
        previous.filter(
          (item) => cartItemKey(item) !== key
        )
      );
    },
    []
  );

  /* =====================================================
     UPDATE QUANTITY
  ===================================================== */

  const updateQuantity = useCallback(
    (key: string, quantity: number) => {
      if (!Number.isFinite(quantity)) {
        return;
      }

      const nextQuantity = Math.max(
        1,
        Math.floor(quantity)
      );

      setCart((previous) =>
        previous.map((item) =>
          cartItemKey(item) === key
            ? {
                ...item,
                quantity: nextQuantity,
              }
            : item
        )
      );
    },
    []
  );

  /* =====================================================
     CLEAR CART
  ===================================================== */

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  /* =====================================================
     WISHLIST
  ===================================================== */

  const toggleWishlist = useCallback(
    (id: string) => {
      const productId = String(id);

      setWishlist((previous) =>
        previous.includes(productId)
          ? previous.filter(
              (entry) => entry !== productId
            )
          : [...previous, productId]
      );
    },
    []
  );

  const isInWishlist = useCallback(
    (id: string) =>
      wishlist.includes(String(id)),
    [wishlist]
  );

  const cartCount = cart.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        clearCart,
        updateQuantity,
        wishlist,
        toggleWishlist,
        isInWishlist,
        cartCount,
        hydrated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider. Check app/layout.tsx."
    );
  }

  return context;
}
