import { supabase, SUPABASE_BUCKET } from "../config/supabase.js";

/**
 * Saves an encrypted file to Supabase Storage.
 */
export const saveFile = async (filename, buffer, mimeType) => {
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(filename, buffer, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }

  return data;
};

/**
 * Reads an encrypted file from Supabase Storage.
 */
export const getFile = async (filename) => {
  const { data, error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .download(filename);

  if (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }

  return Buffer.from(await data.arrayBuffer());
};

/**
 * Deletes a file from Supabase Storage.
 */
export const deleteFile = async (filename) => {
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .remove([filename]);

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};