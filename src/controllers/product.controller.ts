import { Request, Response } from 'express';
import { supabase } from '../config/db';
import { getCachedRates } from '../utils/getCachedRates';

export const GetProducts = async (req: Request, res: Response) => {
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = rates[currency || 'USD'];

  const { data: products, error } = await supabase
    .from('products')
    .select('name,slug,description,price,size,quantity,image');

  if (error) {
    return res.status(500).json({ message: 'Error fetching products' });
  }
  const convertedProducts = products.map((product) => ({
    ...product,
    price: Math.round(product.price * rate),
  }));

  res
    .status(200)
    .json({ message: 'Products fetched successfully', convertedProducts });
};

export const GetProductbyCollectionId = async (req: Request, res: Response) => {
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = rates[currency || 'USD'];
  const collectionSlug = req.params.collectionSlug;

  const { data: CollectionId, error: collectionError } = await supabase
    .from('collections')
    .select('id')
    .eq('slug', collectionSlug)
    .single();
  if (collectionError || !CollectionId) {
    return res.status(404).json({ message: 'Collection not found' });
  }

  const { data: CollectionProducts, error: producterror } = await supabase
    .from('products')
    .select('id,name,slug,description,price,size,quantity,image')
    .eq('collectionid', CollectionId.id);
  if (producterror) {
    return res.status(500).json({
      message: 'Error fetching products for collection',
    });
  }
  const convertedProductCollection = CollectionProducts.map((collection) => ({
    ...collection,
    price: Math.round(collection.price * rate),
  }));

  res.status(200).json({
    message: 'Products fetched successfully for collection',
    products: convertedProductCollection,
  });
};

export const GetProductByName = async (req: Request, res: Response) => {
  const currency = req.currency;
  const rates = await getCachedRates();
  const rate = rates[currency || 'USD'];
  const productName = req.params.slug;

  const { data: product, error } = await supabase
    .from('products')
    .select('id,name,slug,description,price,size,quantity,image')
    .ilike('slug', `%${productName}%`);
  if (error || !product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const convertedProduct = product.map((product) => ({
    ...product,
    price: Math.round(product.price * rate),
  }));

  res.status(200).json({
    message: 'Product fetched successfully',
    product: convertedProduct,
  });
};
