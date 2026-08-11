import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname in ES module context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store uploads in a folder inside Backend (not public)
const UPLOADS_DIR = path.join(__dirname, "..", "..", "uploads");

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Saves an encrypted file buffer to disk.
 * @param {string} filename - The unique filename on disk
 * @param {Buffer} buffer - Encrypted file content buffer
 */
export const saveFile = async (filename, buffer) => {
  const filePath = path.join(UPLOADS_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);
};

/**
 * Reads an encrypted file buffer from disk.
 * @param {string} filename - Unique filename on disk
 * @returns {Buffer} Encrypted file content buffer
 */
export const getFile = async (filename) => {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (!fs.existsSync(filePath)) {
    throw new Error("File not found on disk");
  }
  return await fs.promises.readFile(filePath);
};

/**
 * Deletes a file from disk.
 * @param {string} filename - Unique filename on disk
 */
export const deleteFile = async (filename) => {
  const filePath = path.join(UPLOADS_DIR, filename);
  if (fs.existsSync(filePath)) {
    await fs.promises.unlink(filePath);
  }
};
