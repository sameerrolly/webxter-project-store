import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL    = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY    = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const MEDIA_BUCKET = import.meta.env.VITE_SUPABASE_MEDIA_BUCKET || "ProjectsPublic";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set. " +
    "Media uploads will fall back to the Django backend."
  );
}

export const supabase = SUPABASE_URL && SUPABASE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/**
 * Upload a file to Supabase Storage and return its public URL.
 *
 * @param {File}   file        - The File object to upload
 * @param {string} folder      - Subfolder inside the bucket  e.g. "projects/42"
 * @returns {Promise<string>}  - Public URL of the uploaded file
 */
export async function uploadToSupabase(file, folder = "projects") {
  if (!supabase) throw new Error("Supabase is not configured. Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");

  // Build a unique path:  projects/42/1717600000000-photo.jpg
  const ext      = file.name.split(".").pop().toLowerCase();
  const safeName = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const path     = `${folder}/${Date.now()}-${safeName}.${ext}`;

  const { data, error } = await supabase.storage
    .from(MEDIA_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) throw new Error(`Supabase upload failed: ${error.message}`);

  // Get the public URL (works for public buckets — ProjectsPublic is public)
  const { data: urlData } = supabase.storage
    .from(MEDIA_BUCKET)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

/**
 * Delete a file from Supabase Storage by its public URL.
 * Silently ignores errors (file may have already been deleted).
 *
 * @param {string} publicUrl - The full public URL returned by uploadToSupabase
 */
export async function deleteFromSupabase(publicUrl) {
  if (!supabase || !publicUrl) return;
  try {
    // Extract the path after /storage/v1/object/public/<bucket>/
    const marker = `/object/public/${MEDIA_BUCKET}/`;
    const idx    = publicUrl.indexOf(marker);
    if (idx === -1) return;
    const filePath = decodeURIComponent(publicUrl.slice(idx + marker.length));
    await supabase.storage.from(MEDIA_BUCKET).remove([filePath]);
  } catch {
    // Non-fatal — log but don't throw
    console.warn("[Supabase] Could not delete file:", publicUrl);
  }
}
