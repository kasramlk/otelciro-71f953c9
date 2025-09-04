export function asArray<T = any>(v: any): T[] {
  if (Array.isArray(v)) return v as T[];
  if (v && Array.isArray(v.data)) return v.data as T[];      // Supabase style { data, error }
  if (v && typeof v === 'object' && Array.isArray(v.items)) return v.items as T[]; // API style { items: [...] }
  return [];
}