"use client";

// WhatsApp SVG icon from https://simpleicons.org/icons/whatsapp.svg
import clsx from "clsx";
import { useProduct } from "components/product/product-context";
import { Product, ProductVariant } from "lib/shopify/types";
import { useEffect, useMemo, useState } from "react";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9171917197";

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
  }).format(parseFloat(amount));
}

function computeUnitPrice(
  product: Product,
  variant: ProductVariant | undefined,
  quantity: number,
  defaultPrice: string
) {
  // Prefer variant-level tiers if provided
  const variantTiers = (variant as any)?.pricingTiers as
    | {
        minQuantity: number;
        unitPrice: { amount: string; currencyCode: string };
      }[]
    | undefined;
  const productTiers = (product as any).pricingTiers as
    | {
        minQuantity: number;
        unitPrice: { amount: string; currencyCode: string };
      }[]
    | undefined;

  const tiers =
    variantTiers && variantTiers.length ? variantTiers : productTiers;
  if (!tiers || !tiers.length)
    return {
      amount: defaultPrice,
      currency: product.priceRange.minVariantPrice.currencyCode,
    };
  // Find the tier with largest minQuantity <= quantity
  const applicable = tiers
    .filter((t) => quantity >= t.minQuantity)
    .sort((a, b) => b.minQuantity - a.minQuantity)[0];
  if (!applicable)
    return {
      amount: defaultPrice,
      currency: product.priceRange.minVariantPrice.currencyCode,
    };
  return {
    amount: applicable.unitPrice.amount,
    currency: applicable.unitPrice.currencyCode,
  };
}

export function AddToCart({ product }: { product: Product }) {
  const { variants } = product;
  const { state } = useProduct();

  const variant = variants.find((variant: ProductVariant) =>
    variant.selectedOptions.every(
      (option) => option.value === state[option.name.toLowerCase()]
    )
  );
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const selectedVariantId = variant?.id || defaultVariantId;
  const finalVariant = variants.find((v) => v.id === selectedVariantId) as
    | ProductVariant
    | undefined;

  const minQty = product.minAllowedQuantity || 1;
  // Use a string state so the user can edit freely (including clearing to type),
  // and enforce the minimum on blur.
  const [quantityStr, setQuantityStr] = useState<string>(String(minQty));

  const parsedQuantity = useMemo(() => {
    const n = parseInt(quantityStr, 10);
    if (isNaN(n)) return minQty;
    return Math.max(minQty, n);
  }, [quantityStr, minQty]);

  const unitPrice = useMemo(() => {
    const defaultPrice =
      finalVariant?.price.amount || product.priceRange.minVariantPrice.amount;
    return computeUnitPrice(
      product,
      finalVariant,
      parsedQuantity,
      defaultPrice
    );
  }, [product, parsedQuantity, finalVariant]);

  const total = useMemo(
    () => (parseFloat(unitPrice.amount) * parsedQuantity).toFixed(2),
    [unitPrice, parsedQuantity]
  );

  // Avoid hydration mismatch by setting product link on client only
  const [productLink, setProductLink] = useState<string>(product.handle);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setProductLink(window.location.href);
    }
  }, []);

  const whatsappMessage = useMemo(() => {
    const qty = parsedQuantity;
    const opts =
      variants.length &&
      variants[0] &&
      Array.isArray(variants[0].selectedOptions)
        ? variants[0].selectedOptions.map(
            (o) => `${o.name}: ${state[o.name.toLowerCase()] || o.value}`
          )
        : [];
    const selectedOpts = variant
      ? variant.selectedOptions.map(
          (o) => `${o.name}: ${state[o.name.toLowerCase()] || o.value}`
        )
      : opts;
    // Calculate savings if applicable
    let savingsMsg = "";
    const productTiers = (product as any).pricingTiers as { minQuantity: number; unitPrice: { amount: string; currencyCode: string } }[] | undefined;
    if (productTiers && productTiers.length) {
      const baseTier = productTiers[0];
      const basePrice = parseFloat(baseTier.unitPrice.amount);
      const currentPrice = parseFloat(unitPrice.amount);
      if (qty >= baseTier.minQuantity && currentPrice < basePrice) {
        const savings = (basePrice - currentPrice) * qty;
        if (savings > 0) {
          savingsMsg = `\nYou save ${formatMoney(savings.toFixed(2), unitPrice.currency)} on this order!`;
        }
      }
    }
    const msg = `Order request:\nProduct: ${product.title}\nVariant: ${selectedOpts.join(", ")}\nQuantity: ${qty}\nUnit price: ${formatMoney(unitPrice.amount, unitPrice.currency)}\nTotal: ${formatMoney(total, unitPrice.currency)}${savingsMsg}\nProduct link: ${productLink}`;
    return msg;
  }, [
    product,
    variant,
    parsedQuantity,
    unitPrice,
    total,
    state,
    variants,
    productLink,
  ]);

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-row gap-3 items-end w-full overflow-x-auto whitespace-nowrap">
        {/* Quantity */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          <label
            htmlFor="quantity-input"
            className="text-sm font-semibold text-neutral-700 dark:text-neutral-200 mb-1 flex items-center gap-2"
          >
            Quantity
            {product.minAllowedQuantity && product.minAllowedQuantity > 1 && (
              <span className="text-xs text-blue-700 dark:text-blue-400 font-medium">
                (Min. order: {product.minAllowedQuantity})
              </span>
            )}
          </label>
          <input
            id="quantity-input"
            type="number"
            min={minQty}
            value={quantityStr}
            onChange={(e) => {
              const v = e.target.value.replace(/[^0-9]/g, "");
              setQuantityStr(v);
            }}
            onBlur={() => {
              const n = parseInt(quantityStr || String(minQty), 10);
              setQuantityStr(String(isNaN(n) ? minQty : Math.max(minQty, n)));
            }}
            className="w-20 sm:w-24 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-base shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-neutral-700 dark:bg-neutral-900 dark:text-white"
            aria-label="Quantity"
          />
        </div>
        {/* Total price */}
        <div className="flex flex-col gap-1 text-sm justify-end flex-shrink-0">
          {(() => {
            const productTiers = (product as any).pricingTiers as { minQuantity: number; unitPrice: { amount: string; currencyCode: string } }[] | undefined;
            if (!productTiers || !productTiers.length) return null;
            const baseTier = productTiers[0];
            const basePrice = parseFloat(baseTier.unitPrice.amount);
            const currentPrice = parseFloat(unitPrice.amount);
            if (parsedQuantity >= baseTier.minQuantity && currentPrice < basePrice) {
              const savings = (basePrice - currentPrice) * parsedQuantity;
              if (savings > 0) {
                return (
                  <div className="mb-1">
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full animate-pulse">
                      You save {formatMoney(savings.toFixed(2), unitPrice.currency)}
                    </span>
                  </div>
                );
              }
            }
            return null;
          })()}
          <div className="flex items-center h-full">
            <span>Total:&nbsp;</span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {formatMoney(total, unitPrice.currency)}
            </span>
          </div>
        </div>
        {/* Unit price */}
        <div className="flex flex-col gap-1 text-sm justify-end flex-shrink-0">
          <div className="flex items-center gap-2 h-full">
            <span>Unit price:</span>
            <span className="font-semibold text-neutral-900 dark:text-white">
              {formatMoney(unitPrice.amount, unitPrice.currency)}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={clsx(
            "flex w-full sm:w-auto items-center justify-center rounded-full px-6 py-3 text-white font-semibold transition-colors duration-150",
            "bg-[#25D366] hover:bg-[#1ebe57] focus:outline-none focus:ring-2 focus:ring-[#25D366]",
            {
              "opacity-80 pointer-events-none": !finalVariant,
            }
          )}
          aria-disabled={!finalVariant}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-5 w-5 mr-2"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.149-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.075-.148-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.571-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.095 3.2 5.077 4.363.71.306 1.263.489 1.694.626.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.413-.074-.124-.272-.198-.57-.347zm-5.421 6.403h-.001a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.999-3.648-.235-.374A9.86 9.86 0 012.1 11.893C2.073 6.728 6.659 2.1 12 2.1c2.637 0 5.112 1.027 6.988 2.893A9.825 9.825 0 0121.9 12c-.003 5.342-4.631 9.928-9.849 9.928zm8.413-18.342A11.815 11.815 0 0012 0C5.383 0 0 5.383 0 12c0 2.121.555 4.197 1.607 6.032L.057 23.925a1.001 1.001 0 001.225 1.225l5.893-1.548A11.88 11.88 0 0012 24c6.617 0 12-5.383 12-12 0-3.192-1.245-6.191-3.516-8.443z" />
          </svg>
          <span>Order via WhatsApp</span>
        </a>
      </div>

      {/* Tier list - moved to bottom */}
      <div>
        <h3 className="mb-2 text-sm font-medium">Pricing tiers</h3>
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {(() => {
            const variantTiers = (finalVariant as any)?.pricingTiers as
              | {
                  minQuantity: number;
                  unitPrice: { amount: string; currencyCode: string };
                }[]
              | undefined;
            const productTiers = (product as any).pricingTiers as
              | {
                  minQuantity: number;
                  unitPrice: { amount: string; currencyCode: string };
                }[]
              | undefined;
            const tiers =
              variantTiers && variantTiers.length
                ? variantTiers
                : productTiers || [];
            const sorted = [...tiers].sort(
              (a, b) => a.minQuantity - b.minQuantity
            );
            const applicableIndex = sorted.reduce(
              (acc, t, i) => (parsedQuantity >= t.minQuantity ? i : acc),
              -1
            );

            if (!sorted.length) {
              return (
                <li className="rounded border border-neutral-100 bg-neutral-50 p-3 text-sm">
                  No tiered pricing
                </li>
              );
            }

            return sorted.map((t, idx) => {
              const isActive = idx === applicableIndex;
              const unit = t.unitPrice.amount;
              const currency = t.unitPrice.currencyCode;
              const totalForQty = (parseFloat(unit) * parsedQuantity).toFixed(2);

              return (
                <li
                  key={t.minQuantity}
                  className={clsx(
                    "flex items-center justify-between gap-4 rounded-lg border p-3 text-sm transition-colors",
                    isActive
                      ? "border-blue-400 bg-blue-50 ring-2 ring-blue-100"
                      : "border-neutral-100 bg-white"
                  )}
                  aria-current={isActive ? "true" : undefined}
                >
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-black">
                      From {t.minQuantity} pcs
                    </div>
                    <div
                      className={clsx(
                        "mt-1 text-xs",
                        isActive
                          ? "text-blue-700 dark:text-black font-semibold"
                          : "text-neutral-700 dark:text-black"
                      )}
                    >
                      {isActive ? "Selected" : `Min ${t.minQuantity}`}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-neutral-900 dark:text-black">
                      {formatMoney(unit, currency)}
                    </div>
                    <div
                      className={clsx(
                        "mt-1 text-xs",
                        parsedQuantity >= t.minQuantity
                          ? "text-blue-700 dark:text-black"
                          : "text-neutral-700 dark:text-black"
                      )}
                    >
                      {parsedQuantity >= t.minQuantity
                        ? `Total ${formatMoney(totalForQty, currency)}`
                        : `Buy ${t.minQuantity}+`}
                    </div>
                  </div>
                </li>
              );
            });
          })()}
        </ul>
      </div>
    </div>
  );
}
