"use client";
import { AddToCart } from 'components/cart/add-to-cart';
import Price from 'components/price';
import Prose from 'components/prose';
import { Product } from 'lib/shopify/types';
import { useState } from 'react';
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


export function ProductDescription({ product }: { product: Product & { reviews?: any[] } }) {
  const [showReviews, setShowReviews] = useState(false);
  const productReviews = product.reviews || [];
  const avgRating = productReviews.length > 0 ? (productReviews.reduce((acc, r) => acc + (r.reviewRating?.ratingValue || 0), 0) / productReviews.length).toFixed(1) : '0.0';
  return (
    <>
      <div className="flex flex-col gap-1 border-b pb-1 dark:border-neutral-700">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white lg:text-5xl">
          {product.title}
        </h1>
        {/* Ratings summary under product title */}
        {productReviews.length > 0 && (
          <a
            tabIndex={0}
            role="link"
            className="inline-flex items-center gap-2 mb-2 rounded-full px-3 py-1.5 text-yellow-600 dark:text-yellow-400 font-semibold hover:underline hover:text-yellow-700 dark:hover:text-yellow-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            onClick={() => setShowReviews(true)}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setShowReviews(true); } }}
            aria-label="Show reviews"
          >
            <span className="font-bold text-lg">★ {avgRating}</span>
            <span className="text-sm text-neutral-600 dark:text-neutral-300">({productReviews.length} reviews)</span>
          </a>
        )}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 mb-2">
          <span className="inline-flex items-center rounded-xl border border-blue-600 bg-blue-600 px-4 py-2 text-lg sm:text-xl font-bold text-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-400 dark:bg-blue-800 dark:border-blue-700 dark:text-white transition-colors">
            <Price
              amount={getLowestTierPrice(product)}
              currencyCode={product.priceRange.maxVariantPrice.currencyCode}
            />
          </span>
          <span className="text-base sm:text-lg font-medium text-neutral-600 dark:text-neutral-300 ml-1 tracking-wide select-none">onwards</span>
        </div>
      </div>
      {/* Modal for reviews */}
      {showReviews && productReviews.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm transition-all">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-lg w-full p-6 relative animate-fadeIn">
            <button
              className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
              onClick={() => setShowReviews(false)}
              aria-label="Close reviews"
            >
              <span aria-hidden="true">×</span>
            </button>
            <h3 className="text-2xl font-bold mb-6 text-neutral-900 dark:text-white text-center">Customer Reviews</h3>
            <ul className="space-y-6 max-h-96 overflow-y-auto pr-2">
              {productReviews.map((r, i) => (
                <li key={i} className="border-b border-neutral-200 dark:border-neutral-700 pb-4 last:border-b-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-100">{r.author}</span>
                    <span className="text-yellow-500 text-base">{'★'.repeat(r.reviewRating?.ratingValue || 0)}</span>
                    <span className="text-xs text-neutral-500">{r.datePublished}</span>
                  </div>
                  <div className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed">{r.reviewBody}</div>
                </li>
              ))}
            </ul>
          </div>
          <style>{`.animate-fadeIn{animation:fadeIn .2s ease}`}
          </style>
          <style>{`@keyframes fadeIn{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}`}</style>
        </div>
      )}
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
