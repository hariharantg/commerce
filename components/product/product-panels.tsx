"use client";




import { useState } from 'react';


import { Product } from 'lib/shopify/types';

function getPanels(product: Product) {
  return [
    {
      title: 'Shipping and Returns',
      color: 'bg-yellow-400',
      content: (
        <p className="text-base text-neutral-700 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
          {product.personalizable
            ? (
              <>
                Dispatched in 5-7 business days (personalized printing). Shipping charges apply. Delivery time varies.
                <br className="hidden sm:block" />
                Free pickup: Chennai store.
                <br className="hidden sm:block" />
                <span className="block mt-2 font-semibold text-red-600 dark:text-red-400">Non-returnable (personalized item).</span>
              </>
            )
            : (
              <>
                Dispatched in 2-4 business days. Shipping charges apply. Delivery time varies.
                <br className="hidden sm:block" />
                Free pickup: Chennai store.
                <br className="hidden sm:block" />
                <span className="block mt-2 font-semibold text-red-600 dark:text-red-400">Non-returnable.</span>
              </>
            )}
        </p>
      )
    },
    {
      title: 'How this was made',
      color: 'bg-green-400',
      content: (
        <p className="text-base text-neutral-700 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
          Our bags are made from eco-friendly materials and crafted by skilled artisans. Each bag is quality checked before shipping.
          <br className="hidden sm:block" />
          We use sustainable processes and support local communities.
        </p>
      )
    }
  ];
}






type ProductPanelsProps = {
  product: Product;
};

export default function ProductPanels({ product }: ProductPanelsProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const panels = getPanels(product);

  return (
    <section className="mt-4 w-full">
      <div className="flex flex-col gap-4">
        {panels.map((panel, idx) => (
          <div key={panel.title} className="rounded-xl border border-neutral-200 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-700 transition-shadow flex flex-col">
            <button
              className={
                `w-full flex items-center justify-between gap-3 px-6 py-4 rounded-xl group transition-colors duration-200
                bg-white dark:bg-neutral-900
                hover:bg-blue-50 dark:hover:bg-neutral-800
                active:bg-blue-100 dark:active:bg-neutral-800
                focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400`
              }
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              aria-expanded={openIdx === idx}
              aria-controls={`panel-content-${idx}`}
            >
              <span className="flex items-center gap-3">
                <span className={`inline-block w-3 h-3 rounded-full ${panel.color}`} aria-hidden="true"></span>
                <span className="text-lg font-semibold text-neutral-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">{panel.title}</span>
              </span>
              <svg
                className={`w-5 h-5 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transform transition-transform duration-200 ${openIdx === idx ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              id={`panel-content-${idx}`}
              className={`px-6 pt-4 pb-6 transition-all duration-300 ease-in-out overflow-hidden border-t border-neutral-100 dark:border-neutral-800
                ${openIdx === idx ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
              aria-hidden={openIdx !== idx}
            >
              {openIdx === idx && (
                <div>{panel.content}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
