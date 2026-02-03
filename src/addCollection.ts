import { supabase } from './config/db';


export async function generateCollection(){
    const { data:NewCollection, error } = await supabase.from('collections').insert({
        name:'Ember collection',
        description:'This is Ember collection',
        image:'https://oqk3pkp15w.ufs.sh/f/1a6f6f5e-2f4e-4c6b-8f7d-8e2d3c4b5e6f-xyzabc.jpg',
        slug:'ember-collection'

    }).select().single();

    if (error || !NewCollection) {
        throw new Error("Error creating collection");
    }
}