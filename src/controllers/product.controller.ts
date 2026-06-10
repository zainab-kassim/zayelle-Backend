import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { getCachedRates } from '../utils/getCachedRates';
import { getRate } from '../utils/getRate';
import logger from '../middleware/logger';

export const GetProducts = async (req: Request, res: Response) => {
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = getRate(rates, currency);

  const { data: products, error: productError } = await supabase
    .from('products')
    .select(
      'name, slug, description, price, size, quantity, image, collections(slug)',
    );

  if (productError) {
    logger.error(
      {
        productError: {
          message: productError.message,
          details: productError.details,
        },
      },
      'Error fetching products',
    );
    return res.status(500).json({ message: 'Error fetching products' });
  }
  const convertedProducts = products.map((product) => ({
    ...product,
    price: parseFloat((product.price * rate).toFixed(2)),
  }));

  res
    .status(200)
    .json({ message: 'Products fetched successfully', convertedProducts });
};

export const GetProductbyCollectionId = async (req: Request, res: Response) => {
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = getRate(rates, currency);
  const collectionSlug = req.params.collectionSlug;

  const { data: CollectionId, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('slug', collectionSlug)
    .single();
  if (collectionError || !CollectionId) {
    logger.error({ collectionError }, 'Collection not found');
    return res.status(404).json({ message: 'Collection not found' });
  }

  const { data: CollectionProducts, error: producterror } = await supabase
    .from('products')
    .select('id,name,slug,description,price,size,quantity,image')
    .eq('collectionid', CollectionId.id);
  if (producterror) {
    logger.error({ producterror }, 'Error fetching products for collection');
    return res.status(500).json({
      message: 'Error fetching products for collection',
    });
  }
  const convertedProductCollection = CollectionProducts.map((collection) => ({
    ...collection,
    price: parseFloat((collection.price * rate).toFixed(2)),
    currency,
  }));

  if (producterror || !CollectionProducts) {
    logger.error({ producterror }, 'Error fetching products for collection');
    return res.status(500).json({
      message: 'Error fetching products for collection',
    });
  }

  res.status(200).json({
    message: 'Products fetched successfully for collection',
    products: convertedProductCollection,
    currency,
  });
};

export const GetProductByName = async (req: Request, res: Response) => {
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = getRate(rates, currency);
  const productName = req.params.slug;

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id,name,slug,description,price,size,quantity,image')
    .ilike('slug', `%${productName}%`);
  if (productError || !product) {
    logger.error({ productError }, 'Product not found');
    return res.status(404).json({ message: 'Product not found' });
  }

  const convertedProduct = product.map((product) => ({
    ...product,
    price: parseFloat((product.price * rate).toFixed(2)),
  }));

  res.status(200).json({
    message: 'Product fetched successfully',
    product: convertedProduct,
  });
};
