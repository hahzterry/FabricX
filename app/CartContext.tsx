"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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

type CartContextValue = {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (id: string, quantity: number) => void;
  wishlist: string[];
  toggleWishlist: (id: string) => void;
  isInWishlist: (id: string) => boolean;
};

const CartContext = createContext<CartContextValue>({
  cart: [],
  addItem: () => {},
  removeItem: () => {},
  clearCart: () => {},
  updateQuantity: () => {},
  wishlist: [],
  toggleWishlist: () => {},
  isInWishlist: () => false,
});

const CART_STORAGE_KEY = "fabricx_cart_v1";
const WISHLIST_STORAGE_KEY = "fabricx_wishlist_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const storedCart = window.localStorage.getItem(CART_STORAGE_KEY);
      const storedWishlist = window.localStorage.getItem(WISHLIST_STORAGE_KEY);

      if (storedCart) {
        const parsed = JSON.parse(storedCart);
        if (Array.isArray(parsed)) {
          setCart(
            parsed.map((item: any) => ({
              ...item,
              variant_id: Number(
                item.variant_id ?? item.variantId ?? 0
              ),
            }))
          );
        }
      }

      if (storedWishlist) {
        const parsed = JSON.parse(storedWishlist);
        if (Array.isArray(parsed)) setWishlist(parsed);
      }
    } catch (error) {
      console.error("Failed to load cart:", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cart)
      );
    } catch (error) {
      console.error("Failed to save cart:", error);
    }
  }, [cart, hydrated]);

  useEffect(() => {
    if (!hydrated) return;

    try {
      window.localStorage.setItem(
        WISHLIST_STORAGE_KEY,
        JSON.stringify(wishlist)
      );
    } catch (error) {
      console.error("Failed to save wishlist:", error);
    }
  }, [wishlist, hydrated]);

  const addItem: CartContextValue["addItem"] = (item) => {
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (ci) =>
          ci.id === item.id &&
          ci.variant_id === item.variant_id
      );

      if (existingIndex !== -1) {
        const updated = [...prev];

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity:
            updated[existingIndex].quantity + (item.quantity ?? 1),
        };

        return updated;
      }

      return [
        ...prev,
        {
          ...item,
          quantity: item.quantity ?? 1,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setCart((prev) =>
      prev.filter(
        (item) => `${item.id}:${item.variant_id}` !== id
      )
    );
  };

  const clearCart = () => setCart([]);

  const updateQuantity = (id: string, quantity: number) => {
    setCart((prev) =>
      prev.map((item) =>
        `${item.id}:${item.variant_id}` === id
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const toggleWishlist = (id: string) => {
    setWishlist((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : [...prev, id]
    );
  };

  const isInWishlist = (id: string) => wishlist.includes(id);

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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
