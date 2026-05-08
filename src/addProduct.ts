import { supabase } from './config/db';
import { generateUniqueSlug } from './middleware/generateSlug';

export async function addProduct() {
  const name = 'Zayelle floreal-red';
  const slug = await generateUniqueSlug(name);

  // Implementation for adding a product
  await supabase.from('products').insert([
    {
      collectionid: 11,
      name: name,
      slug: slug,
      description: 'This is a red piece from the zayelle floreal collection',
      price: '120',
      size: ['S', 'M', 'L'],
      quantity: 6,
      image: [
        'https://oqk3pkp15w.ufs.sh/f/H3vgRA928TvFIegFnMvqydlKEzCBswxIZt7GTo168RJY9Lek',
        'https://oqk3pkp15w.ufs.sh/f/0c9a9627-b2d1-445a-be1d-4a2233c7b9b0-57kj6q.jpg',
      ],
    },
  ]);
}
