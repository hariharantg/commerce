'use client';

import clsx from 'clsx';
import { useProduct, useUpdateURL } from 'components/product/product-context';
import { ProductOption, ProductVariant } from 'lib/shopify/types';
import React from 'react';

type Combination = {
  id: string;
  availableForSale: boolean;
  [key: string]: string | boolean;
};

export function VariantSelector({
  options,
  variants
}: {
  options: ProductOption[];
  variants: ProductVariant[];
}) {
  const { state, updateOption } = useProduct();
  const updateURL = useUpdateURL();
  const hasNoOptionsOrJustOneOption =
    !options.length || (options.length === 1 && options[0]?.values.length === 1);

  // Default select the first variant if nothing is selected
  React.useEffect(() => {
    if (variants.length && options.length) {
      const firstVariant = variants[0];
      if (firstVariant && firstVariant.selectedOptions) {
        // Only set default if no option is selected yet
        const noSelection = options.every((option) => {
          const key = option.name.toLowerCase();
          return !state[key];
        });
        if (noSelection) {
          options.forEach((option) => {
            const key = option.name.toLowerCase();
            const value = firstVariant.selectedOptions.find((o) => o.name.toLowerCase() === key)?.value;
            if (value) {
              updateOption(key, value);
            }
          });
          updateURL({ ...state });
        }
      }
    }
  }, [variants, options]);

  if (hasNoOptionsOrJustOneOption) {
    return null;
  }

  const combinations: Combination[] = variants.map((variant) => ({
    id: variant.id,
    availableForSale: variant.availableForSale,
    ...variant.selectedOptions.reduce(
      (accumulator, option) => ({ ...accumulator, [option.name.toLowerCase()]: option.value }),
      {}
    )
  }));

  return options.map((option) => (
    <form key={option.id} className="mb-4">
      <dl>
        <dt className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{option.name}</dt>
        <dd className="flex flex-wrap gap-2 sm:gap-3">
          {option.values.map((value) => {
            const optionNameLowerCase = option.name.toLowerCase();

            // Debug logging to help trace why an option may be disabled.
            // Visible in the browser console when selecting options.
            try {
              // eslint-disable-next-line no-console
              console.debug('[VariantSelector]', {
                option: option.name,
                value,
                currentState: state,
                options
              });
            } catch {}

            // Base option params on current selectedOptions so we can preserve any other param state.
            const optionParams = { ...state, [optionNameLowerCase]: value };

            // Filter out invalid options and check if the option combination is available for sale.
            const filtered = Object.entries(optionParams).filter(([key, value]) =>
              options.find(
                (option) => option.name.toLowerCase() === key && option.values.includes(value)
              )
            );
            const isAvailableForSale = combinations.find((combination) =>
              filtered.every(
                ([key, value]) => combination[key] === value && combination.availableForSale
              )
            );

            // The option is active if it's in the selected options.
            const isActive = state[optionNameLowerCase] === value;

            return (
              <button
                type="button"
                onClick={() => {
                  try {
                    console.debug('[VariantSelector] click', { option: option.name, value });
                  } catch {}
                  const newState = updateOption(optionNameLowerCase, value);
                  updateURL(newState);
                }}
                key={value}
                aria-disabled={!isAvailableForSale}
                disabled={!isAvailableForSale}
                title={`${option.name} ${value}${!isAvailableForSale ? ' (Out of Stock)' : ''}`}
                className={clsx(
                  'relative flex min-w-[44px] items-center justify-center rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                  {
                    'border-blue-600 ring-2 ring-blue-600 bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white': isActive,
                    'bg-neutral-100 text-neutral-800 border-neutral-300 hover:bg-blue-50 dark:bg-neutral-900 dark:text-neutral-200 dark:border-neutral-700 dark:hover:bg-blue-900': !isActive && isAvailableForSale,
                    'cursor-not-allowed opacity-60 bg-neutral-100 text-neutral-400 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-800': !isAvailableForSale
                  }
                )}
              >
                {value}
                {!isAvailableForSale && (
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-red-500 bg-white/70 dark:bg-neutral-900/70 pointer-events-none select-none">
                    ×
                  </span>
                )}
              </button>
            );
          })}
        </dd>
      </dl>
    </form>
  ));
}
