import { supabase } from '../../db/supabase.js';

function buildFallbackStorageUrl(companyId, fileName) {
  return `storage://documents/${companyId}/${Date.now()}_${fileName}`;
}

export async function uploadToSupabase(fileName, buffer, companyId = 'public') {
  // If Supabase client isn't configured, return a stub URL so ingestion can continue locally.
  if (!supabase) {
    const stubUrl = buildFallbackStorageUrl(companyId, fileName);
    return { storageUrl: stubUrl, path: null };
  }

  try {
    const bucket = 'documents';
    const timestamp = Date.now();
    const safePath = `${companyId}/${timestamp}_${fileName}`;

    // Upload as binary
    const { data, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(safePath, buffer, { upsert: false });

    if (uploadError) {
      throw uploadError;
    }

    // Obtain a public URL (depends on your Supabase bucket policy)
    const { data: publicData } = await supabase.storage.from(bucket).getPublicUrl(safePath);

    return { storageUrl: publicData.publicUrl, path: safePath };
  } catch (err) {
    console.error('uploadToSupabase error', err);
    throw new Error(`Storage upload failed: ${err?.message || String(err)}`);
  }
}
