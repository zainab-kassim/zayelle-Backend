import { supabase } from "./config/db";
import { generateUniqueSlug } from "./middleware/generateSlug";


export async function addProduct() {
    const name = "Zayelle Luxe weave";
    const slug = await generateUniqueSlug(name);


    // Implementation for adding a product
    await supabase.from('products').insert([
        {
            collectionid: 1,
            name: "Zayelle Luxe weave",
            slug: slug,
            description: "This is a luxurious weave from Zayelle red fabric",
            price: "49,000",
            size: ["S", "M", "L"],
            quantity: 6,
            image: ["https://oqk3pkp15w.ufs.sh/f/7063dead-6f6b-4c1e-b7e4-5e9d68a5050f-eqkwve.jpg", "https://oqk3pkp15w.ufs.sh/f/0c9a9627-b2d1-445a-be1d-4a2233c7b9b0-57kj6q.jpg"],
        }
    ])

}