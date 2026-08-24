/**
 * Product data.
 *
 * Public reads go over plain fetch against Supabase's REST endpoint instead
 * of the JS SDK. The SDK is ~58KB gzipped and Shop/Product are the pages that
 * need to paint fastest, so it is loaded lazily and only where it earns its
 * weight: auth, storage uploads and admin writes.
 */
const REST_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const isSupabaseConfigured = Boolean(REST_URL && ANON_KEY);

async function rest(path) {
  const res = await fetch(`${REST_URL}/rest/v1/${path}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  if (!res.ok) throw new Error(`Supabase returned ${res.status}`);
  return res.json();
}

/** The SDK, loaded on demand. Only admin paths pay for it. */
async function sdk() {
  const mod = await import('./supabase.js');
  return mod.supabase;
}

export const CATEGORIES = [
  { id: 'sneakers', label: 'Sneakers' },
  { id: 'boots', label: 'Boots' },
  { id: 'jackets', label: 'Jackets' },
  { id: 'crocs', label: 'Crocs' },
  { id: 'kids', label: 'Kids' },
];

export function categoryLabel(id) {
  return CATEGORIES.find((c) => c.id === id)?.label || id;
}

/** "Sapphire Row Converse" -> "sapphire-row-converse" */
export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

/** Cover image first, then any extra gallery shots, de-duplicated. */
export function galleryFor(product) {
  if (!product) return [];
  const all = [product.image_url, ...(product.images || [])].filter(Boolean);
  return [...new Set(all)];
}

/* ------------------------------------------------------------ public reads */

/** Published products, in Dianna's chosen order. */
export async function fetchPublishedProducts() {
  if (!isSupabaseConfigured) return { data: [], error: null, unconfigured: true };
  try {
    const data = await rest(
      'products?select=*&published=eq.true&order=sort_order.asc,created_at.desc'
    );
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

export async function fetchProductBySlug(slug) {
  if (!isSupabaseConfigured) return { data: null, error: null, unconfigured: true };
  try {
    const rows = await rest(
      `products?select=*&published=eq.true&slug=eq.${encodeURIComponent(slug)}&limit=1`
    );
    // An empty array is the normal result for a mistyped URL, not an error.
    return { data: rows[0] || null, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/* ------------------------------------------------------------- admin reads */

/** Everything, drafts included. Requires a signed-in session. */
export async function fetchAllProducts() {
  if (!isSupabaseConfigured) return { data: [], error: null };
  const supabase = await sdk();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function createProduct(fields) {
  const supabase = await sdk();
  const { data, error } = await supabase.from('products').insert([fields]).select().single();
  return { data, error };
}

export async function updateProduct(id, fields) {
  const supabase = await sdk();
  const { data, error } = await supabase
    .from('products')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  return { data, error };
}

export async function deleteProduct(id) {
  const supabase = await sdk();
  const { error } = await supabase.from('products').delete().eq('id', id);
  return { error };
}

/** Persist a reordered list. Writes only the rows whose position changed. */
export async function saveOrder(products) {
  const supabase = await sdk();
  const updates = products
    .map((p, i) => ({ p, i }))
    .filter(({ p, i }) => p.sort_order !== i)
    .map(({ p, i }) => supabase.from('products').update({ sort_order: i }).eq('id', p.id));
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  return { error: failed ? failed.error : null };
}

/* ----------------------------------------------------------------- storage */

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

/**
 * Upload one photo to the product-images bucket and return its public URL.
 * Filenames are prefixed with a timestamp so re-uploading the same photo
 * never silently overwrites an older one.
 */
export async function uploadProductImage(file, slug) {
  if (!isSupabaseConfigured) return { url: null, error: new Error('Supabase is not configured') };
  if (!file.type.startsWith('image/')) {
    return { url: null, error: new Error('That file is not an image.') };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { url: null, error: new Error('That photo is larger than 8MB. Try a smaller one.') };
  }

  const supabase = await sdk();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `${slug || 'unsorted'}/${Date.now()}-${safeName}`;

  const { error } = await supabase.storage
    .from('product-images')
    .upload(path, file, { cacheControl: '31536000', upsert: false });
  if (error) return { url: null, error };

  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return { url: data.publicUrl, error: null };
}