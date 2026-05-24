import { processDocument } from '../services/ingestion/processDocument.js';
import { saveDocumentChunks } from '../services/ingestion/saveDocumentChunks.js';
import { uploadToSupabase } from '../services/storage/uploadToSupabase.js';
import { supabase } from '../db/supabase.js';

export async function uploadDocument(req, res) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded. Use form field `file`.' });
    }

    const companyId = req.companyId || null;

    let documentRecord = null;

    // If Supabase is configured and companyId is provided, create a document record with status=processing
    if (supabase && companyId) {
      const { data: insertData, error: insertError } = await supabase
        .from('documents')
        .insert([{ company_id: companyId, file_name: file.originalname, storage_url: `pending://${companyId}/${file.originalname}`, status: 'processing' }])
        .select()
        .single();

      if (insertError) {
        console.warn('Could not insert documents record:', insertError.message || insertError);
      } else {
        documentRecord = insertData;
      }
    }

    // Upload to Supabase storage (or get stub URL when not configured)
    const uploadResult = await uploadToSupabase(file.originalname, file.buffer, companyId ?? 'public');

    // If we created a DB record, update it with the storage URL and mark ready
    if (supabase && documentRecord && uploadResult.storageUrl) {
      const { error: updErr } = await supabase
        .from('documents')
        .update({ storage_url: uploadResult.storageUrl, status: 'ready' })
        .eq('id', documentRecord.id);

      if (updErr) console.warn('Failed to update document record after upload:', updErr.message || updErr);
    }

    // Process PDF in-memory to extract chunks/embeddings for quick feedback
    const result = await processDocument({ buffer: file.buffer, fileName: file.originalname });

    let chunkSaveResult = { saved: 0, skipped: true };
    if (supabase && documentRecord?.id && companyId) {
      try {
        chunkSaveResult = await saveDocumentChunks({
          companyId,
          documentId: documentRecord.id,
          chunks: result.chunks,
        });
      } catch (chunkErr) {
        console.warn('Failed to save document chunks:', chunkErr.message || chunkErr);
      }
    }

    return res.json({
      message: 'Processed successfully',
      fileName: file.originalname,
      storage: uploadResult,
      dbRecord: documentRecord,
      chunkCount: result.chunks.length,
      chunkSaveResult,
      sampleChunk: result.chunks[0] ?? null,
    });
  } catch (err) {
    console.error('uploadDocument error', err);
    return res.status(500).json({ message: 'Failed to process document', error: String(err) });
  }
}

export async function listDocuments(req, res) {
  const companyId = req.companyId;
  if (!companyId) {
    return res.status(401).json({ message: 'Company context is required.' });
  }

  try {
    if (!supabase) {
      return res.json({ documents: [] });
    }

    const { data, error } = await supabase
      .from('documents')
      .select('id, company_id, file_name, storage_url, status, created_at')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const documents = Array.isArray(data) ? data : [];

    const documentIds = documents.map((document) => document.id);
    let chunkCounts = {};

    if (documentIds.length > 0) {
      const { data: chunkRows, error: chunkError } = await supabase
        .from('document_chunks')
        .select('document_id')
        .eq('company_id', companyId)
        .in('document_id', documentIds);

      if (chunkError) {
        throw chunkError;
      }

      chunkCounts = (chunkRows || []).reduce((accumulator, row) => {
        const key = row.document_id;
        accumulator[key] = (accumulator[key] || 0) + 1;
        return accumulator;
      }, {});
    }

    return res.json({
      documents: documents.map((document) => ({
        ...document,
        chunkCount: chunkCounts[document.id] || 0,
      })),
    });
  } catch (err) {
    console.error('listDocuments error', err);
    return res.status(500).json({ message: 'Failed to list documents', error: String(err) });
  }
}

export async function deleteDocument(req, res) {
  const companyId = req.companyId;
  const documentId = req.params.id;

  if (!companyId) {
    return res.status(401).json({ message: 'Company context is required.' });
  }

  if (!documentId) {
    return res.status(400).json({ message: 'Document id is required.' });
  }

  try {
    if (!supabase) {
      return res.json({ deleted: true, documentId, companyId, offline: true });
    }

    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId)
      .eq('company_id', companyId);

    if (error) {
      throw error;
    }

    return res.json({ deleted: true, documentId, companyId });
  } catch (err) {
    console.error('deleteDocument error', err);
    return res.status(500).json({ message: 'Failed to delete document', error: String(err) });
  }
}
