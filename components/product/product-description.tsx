import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import { Product } from 'lib/shopify/types';
import { VariantSelector } from './variant-selector';

// Helper to get the lowest tier price
function getLowestTierPrice(product: Product): string {
  const tiers = (product as any).pricingTiers as { minQuantity: number; unitPrice: { amount: string } }[] | undefined;
  if (tiers?.length) {
    const initial = tiers[0]?.unitPrice?.amount ?? '0';
    return tiers.reduce((min, t) => (parseFloat(t.unitPrice.amount) < parseFloat(min) ? t.unitPrice.amount : min), initial);
  }
  // fallback to minVariantPrice
  return product.priceRange.minVariantPrice.amount;
}

export function ProductDescription({ product }: { product: Product }) {
  return (
    <>
      <div className="flex flex-col gap-1 border-b pb-1 dark:border-neutral-700">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-5xl">
          {product.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 mb-2">
          <span className="inline-flex items-center rounded-lg border border-blue-600 bg-blue-600 px-3 py-1.5 text-lg sm:text-xl font-bold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-800 dark:border-blue-700 dark:text-white">
            <Price
              amount={getLowestTierPrice(product)}
              currencyCode={product.priceRange.maxVariantPrice.currencyCode}
            />
          </span>
          <span className="text-base sm:text-lg text-neutral-700 dark:text-neutral-300">onwards</span>
        </div>
      </div>
      <div className="mb-0">
        <VariantSelector options={product.options} variants={product.variants} />
      </div>
      {product.descriptionHtml ? (
        <Prose
          className="mb-0 text-base leading-relaxed text-gray-700 dark:text-white/[60%]"
          html={product.descriptionHtml}
        />
      ) : null}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
        <AddToCart product={product} />
      </div>
    </>
  );
}
