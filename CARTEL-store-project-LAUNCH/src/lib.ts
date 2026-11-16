import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;
export const supabase = url && key ? createClient(url, key) : null;
export const backendReady = Boolean(supabase);

export type Product = {
  id: string; name: string; slug: string; description: string; price: number;
  image_url: string; back_image_url?: string | null; category: string;
  sizes: string[]; colors: string[]; stock: number; featured?: boolean;
};

export const demoProducts: Product[] = [
  {id:'demo-1', name:'CARTEL BLACK JERSEY', slug:'cartel-black-jersey', description:'A football-inspired technical jersey built for the street. Lightweight feel, bold CARTEL identity and an athletic cut.', price:299, image_url:'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1100&q=85', category:'JERSEYS', sizes:['S','M','L','XL','XXL'], colors:['Black'], stock:30, featured:true},
  {id:'demo-2', name:'CARTEL MATCHING SHORTS', slug:'cartel-matching-shorts', description:'Clean athletic shorts designed to complete the set. Easy movement with a sharp, understated finish.', price:199, image_url:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?auto=format&fit=crop&w=1100&q=85', category:'BOTTOMS', sizes:['S','M','L','XL','XXL'], colors:['Black'], stock:30},
  {id:'demo-3', name:'CARTEL FULL SET', slug:'cartel-full-set', description:'The complete CARTEL match-day uniform: jersey and matching shorts, made to move together.', price:449, image_url:'https://images.unsplash.com/photo-1523398002811-999ca8dec234?auto=format&fit=crop&w=1100&q=85', category:'SETS', sizes:['S','M','L','XL','XXL'], colors:['Black'], stock:20, featured:true},
  {id:'demo-4', name:'CARTEL OVERSIZED TEE', slug:'cartel-oversized-tee', description:'A premium oversized everyday essential with a confident silhouette and clean streetwear attitude.', price:249, image_url:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=1100&q=85', category:'TEES', sizes:['S','M','L','XL','XXL'], colors:['Black','White'], stock:25}
];
export const money = (n:number) => `${n.toLocaleString('fr-MA')} MAD`;
