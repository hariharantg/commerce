
import { getCollection, getCollectionProducts } from 'lib/shopify';
import { Metadata } from 'next';
import Head from 'next/head';
import { notFound } from 'next/navigation';

import GoogleReviewsWidget from 'components/google-reviews-widget';
import Grid from 'components/grid';
import ProductGridItems from 'components/layout/product-grid-items';
import { defaultSort, sorting } from 'lib/constants';

export async function generateMetadata(props: {
  params: Promise<{ collection: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  const collection = await getCollection(params.collection);

  if (!collection) return notFound();

  return {
    title: collection.seo?.title || collection.title,
    description:
      collection.seo?.description || collection.description || `${collection.title} products`
  };
}

export default async function CategoryPage(props: {
  params: Promise<{ collection: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const { sort } = searchParams as { [key: string]: string };
  const { sortKey, reverse } = sorting.find((item) => item.slug === sort) || defaultSort;
  const products = await getCollectionProducts({ collection: params.collection, sortKey, reverse });
  const collection = await getCollection(params.collection);

  // Structured data for SEO
  const productListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: collection?.title || params.collection,
    itemListElement: products.map((product: any, idx: number) => ({
      '@type': 'Product',
      position: idx + 1,
      name: product.title,
      image: product.image,
      description: product.description,
      url: `/product/${product.handle}`
    }))
  };

  return (
    <>
      <Head>
        <title>{collection?.seo?.title || collection?.title || 'Collection'} | Thamboolam Bags</title>
        <meta name="description" content={collection?.seo?.description || collection?.description || `${collection?.title} products`} />
        <link rel="canonical" href={`/search/${params.collection}`} />
        <meta property="og:title" content={collection?.seo?.title || collection?.title} />
        <meta property="og:description" content={collection?.seo?.description || collection?.description || `${collection?.title} products`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`/search/${params.collection}`} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productListJsonLd) }} />
      </Head>
      <section>
        <h1 className="text-3xl font-extrabold text-yellow-900 mb-6 mt-4 text-center">
          {collection?.title || 'Collection'}
        </h1>
        {collection?.description && (
          <p className="text-lg text-yellow-800 max-w-2xl mx-auto mb-8 text-center">{collection.description}</p>
        )}
        {products.length === 0 ? (
          <p className="py-3 text-lg text-center">No products found in this collection</p>
        ) : (
          <Grid className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <ProductGridItems products={products} />
          </Grid>
        )}
        <div className="mt-12">
          <GoogleReviewsWidget />
        </div>
      </section>
    </>
  );
}
