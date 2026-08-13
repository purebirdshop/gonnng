import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import { supabase, normalizeDataUrl, normalizeStorageUrl } from '../lib/supabase.js';

const router = Router();
const upload = multer({ limits: { fileSize: 50 * 1024 * 1024 } });

// GET /api/storage/status - Returns Supabase storage configuration status
router.get('/api/storage/status', (_req: Request, res: Response) => {
    const isConfigured = !!supabase;
    return res.json({
      enabled: isConfigured,
      provider: 'Supabase Storage',
      buckets: ['Gonnng'],
      instructions: isConfigured
        ? 'Connected to Supabase Storage.'
        : 'Supabase Storage configuration pending. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_ANON_KEY.'
    });
  });

// Helper to ensure Supabase storage bucket exists before uploading
  const ensureBucketExists = async (bucketName: string) => {
    if (!supabase) return;
    try {
      const { data: bucketInfo, error: getErr } = await supabase.storage.getBucket(bucketName);
      if (getErr || !bucketInfo) {
        console.log(`Bucket '${bucketName}' not found on Supabase. Creating bucket...`);
        const { error: createErr } = await supabase.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 52428800 // 50MB
        });
        if (createErr && !createErr.message.includes('already exists')) {
          console.warn(`Note creating bucket '${bucketName}':`, createErr.message);
        }
      }
    } catch (err) {
      console.warn(`Bucket check exception for '${bucketName}':`, err);
    }
  };

// POST /api/storage/upload - Uploads files directly to Supabase Storage bucket
router.post('/api/storage/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ success: false, error: 'No file supplied in request.' });
      }

      const bucket = (req.body.bucket as string) || process.env.SUPABASE_STORAGE_BUCKET || 'post-media';
      const storagePath = (req.body.path as string) || `uploads/${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;

      if (!supabase) {
        return res.status(500).json({ success: false, error: 'Supabase server client not configured.' });
      }

      await ensureBucketExists(bucket);

      let { data, error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'application/octet-stream',
          cacheControl: '3600',
          upsert: true
        });

      if (error && (error.message?.toLowerCase().includes('bucket not found') || error.message?.toLowerCase().includes('not found'))) {
        console.warn(`Bucket '${bucket}' not found on upload attempt. Retrying after bucket creation...`);
        await supabase.storage.createBucket(bucket, { public: true, fileSizeLimit: 52428800 });
        const retry = await supabase.storage
          .from(bucket)
          .upload(storagePath, file.buffer, {
            contentType: file.mimetype || 'application/octet-stream',
            cacheControl: '3600',
            upsert: true
          });
        data = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Server-side Supabase Storage upload error:', error.message);
        return res.status(500).json({ success: false, error: error.message });
      }

      const finalPath = data?.path || storagePath;
      let cleanPath = finalPath.replace(/^\/+/, '');
      while (cleanPath.startsWith('media/')) {
        cleanPath = cleanPath.substring(6).replace(/^\/+/, '');
      }
      const storageHost = normalizeStorageUrl(process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);
      const dataHost = normalizeDataUrl(process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);

      let s3PublicUrl = `/media/${cleanPath}`;
      if (storageHost) {
        s3PublicUrl = storageHost.includes('.storage.supabase.co')
          ? `${storageHost}/v1/s3/object/public/${bucket}/${cleanPath}`
          : `${storageHost}/storage/v1/s3/object/public/${bucket}/${cleanPath}`;
      } else if (dataHost) {
        s3PublicUrl = `${dataHost}/storage/v1/s3/object/public/${bucket}/${cleanPath}`;
      }

      return res.json({
        success: true,
        bucket,
        path: finalPath,
        publicUrl: `/media/${cleanPath}`,
        s3PublicUrl
      });
    } catch (err: any) {
      console.error('Server storage upload endpoint exception:', err);
      return res.status(500).json({ success: false, error: err?.message || 'Server upload failed.' });
    }
  });

// --- MEDIA PROXY ROUTE FOR SUPABASE STORAGE ---
// Serves /media/{path} through Express using server credentials
router.get(['/media/*', '/storage/v1/s3/object/public/Gonnng/*', '/storage/v1/s3/object/public/post-media/*'], async (req: Request, res: Response) => {
    try {
      let relativePath = (req.params as any)[0] || req.path.replace(/^\/(media|storage\/v1\/s3\/object\/public\/(Gonnng|post-media))\//, '');
      relativePath = relativePath.replace(/^\/+/, '');
      while (relativePath.startsWith('media/')) {
        relativePath = relativePath.substring(6).replace(/^\/+/, '');
      }

      if (!relativePath) {
        return res.status(400).send('Media path required.');
      }

      // 1. Download via Supabase client using server keys across post-media & Gonnng buckets
      if (supabase) {
        for (const bucket of ['post-media', 'Gonnng']) {
          const { data, error } = await supabase.storage.from(bucket).download(relativePath);
          if (!error && data) {
            const buffer = Buffer.from(await data.arrayBuffer());
            const contentType = data.type || 'image/jpeg';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
            return res.send(buffer);
          }
        }
      }

      // 2. Direct HTTP fetch fallback to Supabase public object store
      const storageHost = normalizeStorageUrl(process.env.SUPABASE_STORAGE_URL || process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);
      const dataHost = normalizeDataUrl(process.env.SUPABASE_DATA_URL || process.env.SUPABASE_URL);

      const hostCandidates: string[] = [];
      if (storageHost) {
        if (storageHost.includes('.storage.supabase.co')) {
          hostCandidates.push(`${storageHost}/v1/s3/object/public`);
          hostCandidates.push(`${storageHost}/storage/v1/s3/object/public`);
        } else {
          hostCandidates.push(`${storageHost}/storage/v1/s3/object/public`);
        }
      }
      if (dataHost) {
        const dataPrefix = `${dataHost}/storage/v1/s3/object/public`;
        if (!hostCandidates.includes(dataPrefix)) {
          hostCandidates.push(dataPrefix);
        }
      }

      for (const prefix of hostCandidates) {
        for (const bucket of ['post-media', 'Gonnng']) {
          const targetUrl = `${prefix}/${bucket}/${relativePath}`;
          try {
            const upstreamRes = await fetch(targetUrl);
            if (upstreamRes.ok) {
              const contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
              const arrayBuffer = await upstreamRes.arrayBuffer();
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
              return res.send(Buffer.from(arrayBuffer));
            }
          } catch (fetchErr) {
            console.warn(`Upstream media fetch note for ${targetUrl}:`, fetchErr);
          }
        }
      }

      return res.status(404).send('Media object not found.');
    } catch (err: any) {
      console.error('Media proxy route error:', err);
      return res.status(500).send('Failed to serve media.');
    }
  });

export default router;
