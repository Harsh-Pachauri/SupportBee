import { supabase } from '../../db/supabase.js';

export async function getCompanyBySlug(companySlug) {
  if (!companySlug) return null;

  if (!supabase) {
    return { id: null, slug: companySlug, company_name: companySlug };
  }

  const { data, error } = await supabase
    .from('companies')
    .select('id, slug, company_name')
    .eq('slug', companySlug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}