import { supabase } from '../../db/supabase.js';

export async function getCompanyBySlug(companySlug) {
  if (!companySlug) return null;

  if (!supabase) {
    return { id: null, slug: companySlug, company_name: companySlug };
  }

  const bySlug = await supabase
    .from('companies')
    .select('id, slug, company_name')
    .eq('slug', companySlug)
    .maybeSingle();

  if (bySlug.error) {
    throw bySlug.error;
  }

  if (bySlug.data) {
    return bySlug.data;
  }

  const byId = await supabase
    .from('companies')
    .select('id, slug, company_name')
    .eq('id', companySlug)
    .maybeSingle();

  if (byId.error) {
    throw byId.error;
  }

  return byId.data ?? null;
}