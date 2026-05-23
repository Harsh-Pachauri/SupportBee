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
    const isMissingBucket = err?.statusCode === 404 || err?.status === 400 || /Bucket not found/i.test(err?.message || '');

    if (!isMissingBucket) {
      console.error('uploadToSupabase error', err);
    } else {
      console.warn('Supabase Storage bucket "documents" is missing. Using fallback storage URL.');
    }

    return {
      storageUrl: buildFallbackStorageUrl(companyId, fileName),
      path: null,
      error: String(err),
    };
  }
}
