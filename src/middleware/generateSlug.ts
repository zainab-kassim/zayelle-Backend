import slugify from "slugify"
import { supabase } from "../config/db";


export async function generateUniqueSlug(name: string) {
    let baseSlug = slugify(name, { lower: true, strict: true });
    let counter = 1;

    while (true) {
        const { data: foundSlug, error } = await supabase.from('products').select().eq('slug', baseSlug)
        if (error) {
            throw new Error("Error checking slug uniqueness")
        }
        // If no product found with this slug, it's unique!
        if (!foundSlug || foundSlug.length === 0) {
            return baseSlug;
        }

        // Slug exists, try the next one
        baseSlug = `${baseSlug}-${counter}`;
        counter++;
    }
}