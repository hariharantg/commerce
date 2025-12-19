import { readFileSync } from 'fs';
import { HIDDEN_PRODUCT_TAG, TAGS } from 'lib/constants';
import { unstable_cacheLife as cacheLife, unstable_cacheTag as cacheTag, revalidateTag } from 'next/cache';
import { cookies, headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { join } from 'path';
// Local-only: no remote GraphQL queries/mutations required
import {
  Cart,
  Collection,
  Connection,
  Image,
  Menu,
  Page,
  Product,
  ShopifyCart,
  ShopifyCollection,
  ShopifyProduct
} from './types';

// Force local-only mode: do not use any Shopify endpoint or tokens.
const domain = '';
const endpoint = '';
const key = '';

type ExtractVariables<T> = T extends { variables: object }
  ? T['variables']
  : never;

export async function shopifyFetch<T>({
  headers,
  query,
  variables
}: {
  headers?: HeadersInit;
  query: string;
  variables?: ExtractVariables<T>;
}): Promise<{ status: number; body: T } | never> {
  // Local-only mode: remote fetch removed.
  throw new Error('shopifyFetch is not available in local-only mode');
}

const loadLocal = <T = any>(filename: string): T => {
  const p = join(process.cwd(), 'lib', 'shopify', 'local', filename);
  try {
    const content = readFileSync(p, 'utf-8');
    return JSON.parse(content) as T;
  } catch (err) {
    console.error(`Failed to load local file: ${p}`, err);
    return [] as unknown as T;
  }
};

const removeEdgesAndNodes = <T>(array: Connection<T>): T[] => {
  return array.edges.map((edge) => edge?.node);
};

const reshapeCart = (cart: ShopifyCart): Cart => {
  if (!cart.cost?.totalTaxAmount) {
    cart.cost.totalTaxAmount = {
      amount: '0.0',
      currencyCode: cart.cost.totalAmount.currencyCode
    };
  }

  return {
    ...cart,
    lines: removeEdgesAndNodes(cart.lines)
  };
};

const reshapeCollection = (
  collection: ShopifyCollection
): Collection | undefined => {
  if (!collection) {
    return undefined;
  }

  return {
    ...collection,
    path: `/search/${collection.handle}`
  };
};

const reshapeCollections = (collections: ShopifyCollection[]) => {
  const reshapedCollections = [];

  for (const collection of collections) {
    if (collection) {
      const reshapedCollection = reshapeCollection(collection);

      if (reshapedCollection) {
        reshapedCollections.push(reshapedCollection);
      }
    }
  }

  return reshapedCollections;
};

const reshapeImages = (images: Connection<Image>, productTitle: string) => {
  const flattened = removeEdgesAndNodes(images);

  return flattened.map((image) => {
    const filename = image.url.match(/.*\/(.*)\..*/)?.[1];
    return {
      ...image,
      altText: image.altText || `${productTitle} - ${filename}`
    };
  });
};

const reshapeProduct = (
  product: ShopifyProduct,
  filterHiddenProducts: boolean = true
) => {
  if (
    !product ||
    (filterHiddenProducts && product.tags.includes(HIDDEN_PRODUCT_TAG))
  ) {
    return undefined;
  }

  const { images, variants, ...rest } = product;

  // Ensure a `Color` option exists for products that provide imagesByColor
  const existingOptions = (rest as any).options || [];
  const imagesByColor = (product as any).imagesByColor as Record<string, string[]> | undefined;

  let options = existingOptions;
  if (imagesByColor) {
    const colorValues = Object.keys(imagesByColor);
    const hasColorOption = existingOptions.some((o: any) => o.name?.toLowerCase() === 'color');
    if (!hasColorOption && colorValues.length) {
      options = [
        ...existingOptions,
        {
          id: 'color-option',
          name: 'Color',
          values: colorValues
        }
      ];
    }
  }

  return {
    ...rest,
    options,
    images: reshapeImages(images, product.title),
    variants: removeEdgesAndNodes(variants)
  };
};

const reshapeProducts = (products: ShopifyProduct[]) => {
  const reshapedProducts = [];

  for (const product of products) {
    if (product) {
      const reshapedProduct = reshapeProduct(product);

      if (reshapedProduct) {
        reshapedProducts.push(reshapedProduct);
      }
    }
  }

  return reshapedProducts;
};

export async function createCart(): Promise<Cart> {
  const id = `local-cart-${Date.now()}`;
  const cart: ShopifyCart = {
    id,
    checkoutUrl: '/checkout',
    cost: {
      subtotalAmount: { amount: '0.0', currencyCode: 'USD' },
      totalAmount: { amount: '0.0', currencyCode: 'USD' },
      totalTaxAmount: { amount: '0.0', currencyCode: 'USD' }
    },
    lines: { edges: [] },
    totalQuantity: 0
  };

  return reshapeCart(cart);
}

export async function addToCart(
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cookieStore = await cookies();
  const cartCookie = cookieStore.get('cart');
  let cart: ShopifyCart | undefined;

  if (cartCookie?.value) {
    try {
      cart = JSON.parse(cartCookie.value) as ShopifyCart;
    } catch {}
  }

  if (!cart) {
    // create a new local cart
    const created = await createCart();
    cart = ({
      id: created.id,
      checkoutUrl: created.checkoutUrl,
      cost: created.cost,
      lines: { edges: [] },
      totalQuantity: 0
    } as unknown) as ShopifyCart;
  }

  for (const line of lines) {
    const id = `line-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    const item: any = {
      id,
      quantity: line.quantity,
      cost: { totalAmount: { amount: (line.quantity * 19.99).toFixed(2), currencyCode: 'USD' } },
      merchandise: {
        id: line.merchandiseId,
        title: 'Local item',
        selectedOptions: [],
        product: {
          id: 'local-product',
          handle: 'local-product',
          title: 'Local Product',
          featuredImage: { url: '', altText: '', width: 0, height: 0 }
        }
      }
    };

    cart.lines.edges.push({ node: item });
    cart.totalQuantity = (cart.totalQuantity || 0) + line.quantity;
  }

  const subtotal = cart.lines.edges.reduce((sum, e) => sum + (e.node.quantity * 19.99), 0);
  cart.cost = {
    subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    totalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    totalTaxAmount: { amount: '0.00', currencyCode: 'USD' }
  };

  cookieStore.set('cart', JSON.stringify(cart));

  return reshapeCart(cart as ShopifyCart);
}

export async function removeFromCart(lineIds: string[]): Promise<Cart> {
  const cookieStore = await cookies();
  const cartCookie = cookieStore.get('cart');
  let cart: ShopifyCart | undefined;

  if (cartCookie?.value) {
    try {
      cart = JSON.parse(cartCookie.value) as ShopifyCart;
    } catch {}
  }

  if (!cart) {
    throw new Error('Cart not found');
  }

  cart.lines.edges = cart.lines.edges.filter((e) => !lineIds.includes(e.node.id));
  cart.totalQuantity = cart.lines.edges.reduce((s, e) => s + e.node.quantity, 0);

  const subtotal = cart.lines.edges.reduce((sum, e) => sum + (e.node.quantity * 19.99), 0);
  cart.cost = {
    subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    totalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    totalTaxAmount: { amount: '0.00', currencyCode: 'USD' }
  };

  cookieStore.set('cart', JSON.stringify(cart));

  return reshapeCart(cart as ShopifyCart);
}

export async function updateCart(
  lines: { id: string; merchandiseId: string; quantity: number }[]
): Promise<Cart> {
  const cookieStore = await cookies();
  const cartCookie = cookieStore.get('cart');
  let cart: ShopifyCart | undefined;

  if (cartCookie?.value) {
    try {
      cart = JSON.parse(cartCookie.value) as ShopifyCart;
    } catch {}
  }

  if (!cart) throw new Error('Cart not found');

  for (const line of lines) {
    const existing = cart.lines.edges.find((e) => e.node.id === line.id);
    if (existing) {
      if (line.quantity === 0) {
        cart.lines.edges = cart.lines.edges.filter((e) => e.node.id !== line.id);
      } else {
        existing.node.quantity = line.quantity;
      }
    }
  }

  cart.totalQuantity = cart.lines.edges.reduce((s, e) => s + e.node.quantity, 0);
  const subtotal = cart.lines.edges.reduce((sum, e) => sum + (e.node.quantity * 19.99), 0);
  cart.cost = {
    subtotalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    totalAmount: { amount: subtotal.toFixed(2), currencyCode: 'USD' },
    totalTaxAmount: { amount: '0.00', currencyCode: 'USD' }
  };

  cookieStore.set('cart', JSON.stringify(cart));

  return reshapeCart(cart as ShopifyCart);
}

export async function getCart(): Promise<Cart | undefined> {
  const cartCookie = (await cookies()).get('cart');
  if (!cartCookie?.value) return undefined;
  try {
    const cart = JSON.parse(cartCookie.value) as ShopifyCart;
    return reshapeCart(cart);
  } catch {
    return undefined;
  }
}

export async function getCollection(
  handle: string
): Promise<Collection | undefined> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');
  const collections = loadLocal<ShopifyCollection[]>('collections.json');
  const found = collections.find((c) => c.handle === handle);
  return reshapeCollection(found as ShopifyCollection);
}

export async function getCollectionProducts({
  collection,
  reverse,
  sortKey
}: {
  collection: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.collections, TAGS.products);
  cacheLife('days');
  const products = loadLocal<ShopifyProduct[]>('products.json');
  const collectionHandle = collection;
  const filtered = products.filter((p) => p.tags.includes(collectionHandle));
  return reshapeProducts(filtered as ShopifyProduct[]);
}

export async function getCollections(): Promise<Collection[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');
  const local = loadLocal<ShopifyCollection[]>('collections.json');
  const collections = [
    {
      handle: '',
      title: 'All',
      description: 'All products',
      seo: {
        title: 'All',
        description: 'All products'
      },
      path: '/search',
      updatedAt: new Date().toISOString()
    },
    ...reshapeCollections(local).filter((c) => !c.handle.startsWith('hidden'))
  ];

  return collections;
}

export async function getMenu(handle: string): Promise<Menu[]> {
  'use cache';
  cacheTag(TAGS.collections);
  cacheLife('days');
  const items = loadLocal<{ title: string; url: string }[]>('menu.json');
  return items.map((item) => ({
    title: item.title,
    path: item.url.replace(domain, '').replace('/collections', '/search').replace('/pages', '')
  }));
}

export async function getPage(handle: string): Promise<Page> {
  const pages = loadLocal<Page[]>('pages.json');
  const found = pages.find((p) => p.handle === handle);
  if (!found) throw new Error('Page not found');
  return found as Page;
}

export async function getPages(): Promise<Page[]> {
  return loadLocal<Page[]>('pages.json');
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');
  const products = loadLocal<ShopifyProduct[]>('products.json');
  const found = products.find((p) => p.handle === handle);
  return reshapeProduct(found as ShopifyProduct, false);
}

export async function getProductRecommendations(
  productId: string
): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');
  const products = loadLocal<ShopifyProduct[]>('products.json');
  return reshapeProducts(products as ShopifyProduct[]);
}

export async function getProducts({
  query,
  reverse,
  sortKey
}: {
  query?: string;
  reverse?: boolean;
  sortKey?: string;
}): Promise<Product[]> {
  'use cache';
  cacheTag(TAGS.products);
  cacheLife('days');
  const products = loadLocal<ShopifyProduct[]>('products.json');
  let filtered = products;
  if (query) {
    const q = query.toLowerCase();
    filtered = products.filter((p) => p.handle.toLowerCase().includes(q) || p.title.toLowerCase().includes(q));
  }
  return reshapeProducts(filtered as ShopifyProduct[]);
}

// This is called from `app/api/revalidate.ts` so providers can control revalidation logic.
export async function revalidate(req: NextRequest): Promise<NextResponse> {
  // We always need to respond with a 200 status code to Shopify,
  // otherwise it will continue to retry the request.
  const collectionWebhooks = [
    'collections/create',
    'collections/delete',
    'collections/update'
  ];
  const productWebhooks = [
    'products/create',
    'products/delete',
    'products/update'
  ];
  const topic = (await headers()).get('x-shopify-topic') || 'unknown';
  const secret = req.nextUrl.searchParams.get('secret');
  const isCollectionUpdate = collectionWebhooks.includes(topic);
  const isProductUpdate = productWebhooks.includes(topic);

  if (!secret || secret !== process.env.SHOPIFY_REVALIDATION_SECRET) {
    console.error('Invalid revalidation secret.');
    return NextResponse.json({ status: 401 });
  }

  if (!isCollectionUpdate && !isProductUpdate) {
    // We don't need to revalidate anything for any other topics.
    return NextResponse.json({ status: 200 });
  }

  if (isCollectionUpdate) {
    revalidateTag(TAGS.collections, 'seconds');
  }

  if (isProductUpdate) {
    revalidateTag(TAGS.products, 'seconds');
  }

  return NextResponse.json({ status: 200, revalidated: true, now: Date.now() });
}
