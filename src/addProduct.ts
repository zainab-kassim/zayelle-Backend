import { supabase } from './config/db';
import { generateUniqueSlug } from './middleware/generateSlug';

export async function addProduct() {
  const name = 'Zayelle Ember Bubu';
  const slug = await generateUniqueSlug(name);

  // Implementation for adding a product
  await supabase.from('products').insert([
    {
      collectionid: 1,
      name: name,
      slug: slug,
      description: 'This is a bubu from the ember collection',
      price: '18',
      size: ['S', 'M', 'L'],
      quantity: 6,
      image: [
        'https://6gx805zq79.ufs.sh/f/XraPWYuH0sBRm0aNOM6dj3ugDKrHO721QYAshxItfli8M0qL',
        'https://oqk3pkp15w.ufs.sh/f/0c9a9627-b2d1-445a-be1d-4a2233c7b9b0-57kj6q.jpg',
      ],
    },
  ]);
}
