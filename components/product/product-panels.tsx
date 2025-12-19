"use client";




import { useEffect, useRef, useState } from 'react';

const panels = [
  {
    title: 'Shipping and Returns',
    color: 'bg-yellow-400',
    content: (
      <p className="text-base text-neutral-700 dark:text-neutral-200 whitespace-pre-line leading-relaxed">
        Dispatched in 2-4 business days. Shipping charges apply. Delivery time varies.
        <br className="hidden sm:block" />
        Free pickup: Chennai store.
        <br className="hidden sm:block" />
        <span className="block mt-2 font-semibold text-red-600 dark:text-red-400">Non-returnable.</span>
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
  },
  {
    title: 'Reviews',
    color: 'bg-blue-400',
    content: (
      <div className="pt-2 text-base text-neutral-700 dark:text-neutral-200">
        No reviews yet for this product.
      </div>
    )
  }
];







export default function ProductPanels() {
  const [current, setCurrent] = useState(0);
  const total = panels.length;
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [paused, setPaused] = useState(false);

  const goTo = (idx: number) => {
    if (idx < 0) setCurrent(total - 1);
    else if (idx >= total) setCurrent(0);
    else setCurrent(idx);
  };

  useEffect(() => {
    if (paused) return;
    timerRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % total);
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [current, paused, total]);

  return (
    <section className="mt-8 w-full max-w-2xl mx-auto">
      <div
        className="relative flex flex-col items-center"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onFocus={() => setPaused(true)}
        onBlur={() => setPaused(false)}
        tabIndex={-1}
      >
        <div className="w-full rounded-xl border border-neutral-200 bg-white shadow-sm dark:bg-neutral-900 dark:border-neutral-700 transition-shadow flex flex-col items-center p-6 min-h-[180px]">
          <div className="flex items-center gap-3 mb-4">
            {panels[current] ? (
              <>
                <span className={`inline-block w-3 h-3 rounded-full ${panels[current].color}`} aria-hidden="true"></span>
                <span className="text-lg font-semibold">{panels[current].title}</span>
              </>
            ) : null}
          </div>
          <div className="w-full">{panels[current] ? panels[current].content : null}</div>
        </div>
        {/* Navigation Arrows */}
        <div className="flex items-center justify-center gap-6 mt-4">
          <button
            onClick={() => goTo(current - 1)}
            className="rounded-full p-2 bg-neutral-100 hover:bg-blue-100 dark:bg-neutral-800 dark:hover:bg-blue-900 transition-colors"
            aria-label="Previous"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          {/* Dots */}
          <div className="flex gap-2">
            {panels.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${current === idx ? 'bg-blue-600' : 'bg-neutral-300 dark:bg-neutral-700'}`}
                aria-label={`Go to ${panels[idx] ? panels[idx].title : ''}`}
              />
            ))}
          </div>
          <button
            onClick={() => goTo(current + 1)}
            className="rounded-full p-2 bg-neutral-100 hover:bg-blue-100 dark:bg-neutral-800 dark:hover:bg-blue-900 transition-colors"
            aria-label="Next"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </section>
  );
}
