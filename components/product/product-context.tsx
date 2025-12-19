'use client';

import type { Product } from 'lib/shopify/types';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { createContext, startTransition, useContext, useEffect, useMemo, useOptimistic } from 'react';

type ProductState = {
  [key: string]: string;
} & {
  image?: string;
};

type ProductContextType = {
  state: ProductState;
  updateOption: (name: string, value: string) => ProductState;
  updateImage: (index: string) => ProductState;
  updateURL: (state: ProductState) => void;
};

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children, product, syncToUrl = true }: { children: React.ReactNode; product?: Product; syncToUrl?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getInitialState = () => {
    const params: ProductState = {};
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    // If no URL params and exactly one variant exists, preselect its options.
    if (Object.keys(params).length === 0 && product?.variants?.length === 1) {
      const variant = product.variants[0];
      variant.selectedOptions.forEach((opt) => {
        params[opt.name.toLowerCase()] = opt.value;
      });
    }

    return params;
  };

  const [state, setOptimisticState] = useOptimistic(
    getInitialState(),
    (prevState: ProductState, update: ProductState) => ({
      ...prevState,
      ...update
    })
  );

  // If there are no selected option params on mount and the product has exactly one variant,
  // default-select that variant's options so the UI reflects the single variant.
  useEffect(() => {
    if (!product) return;
    const hasOptionParams = Object.keys(state).some((k) => k !== 'image');
    if (!hasOptionParams && product.variants?.length === 1) {
      const variant = product.variants[0];
      const newState: ProductState = {};
      variant.selectedOptions.forEach((opt) => {
        newState[opt.name.toLowerCase()] = opt.value;
      });
      startTransition(() => setOptimisticState(newState));
    }
    // Only run on mount and when product changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  const updateOption = (name: string, value: string) => {
    console.debug('[ProductProvider] updateOption', { name, value });
    const newState = { [name]: value };
    startTransition(() => setOptimisticState(newState));
    return { ...state, ...newState };
  };

  const updateImage = (index: string) => {
    console.debug('[ProductProvider] updateImage', { index });
    const newState = { image: index };
    startTransition(() => setOptimisticState(newState));
    return { ...state, ...newState };
  };

  const value = useMemo(
    () => ({
      state,
      updateOption,
      updateImage,
      updateURL: (s: ProductState) => {
        if (!syncToUrl) return;
        const newParams = new URLSearchParams(window.location.search);
        Object.entries(s).forEach(([key, value]) => {
          newParams.set(key, value);
        });
        router.push(`?${newParams.toString()}`, { scroll: false });
      }
    }),
    [state]
  );

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
}

export function useProduct() {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProduct must be used within a ProductProvider');
  }
  return context;
}

export function useUpdateURL() {
  // Prefer the provider's updateURL implementation when available so the
  // ProductProvider can control whether to sync to the query string.
  try {
    const context = useContext(ProductContext) as ProductContextType | undefined;
    if (context && context.updateURL) return context.updateURL;
  } catch {}

  const router = useRouter();
  return (state: ProductState) => {
    const newParams = new URLSearchParams(window.location.search);
    Object.entries(state).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.push(`?${newParams.toString()}`, { scroll: false });
  };
}
