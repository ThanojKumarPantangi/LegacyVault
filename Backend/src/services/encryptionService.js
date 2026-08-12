import crypto from "crypto";
import { env } from "../config/env.js";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// Centralized key derivation to guarantee a 32-byte key
const getEncryptionKey = () => {
  const rawKey = env.ENCRYPTION_KEY;
  return crypto.createHash("sha256").update(rawKey).digest();
};

/**
 * Encrypts string data using AES-256-GCM.
 * @param {string} text - The plaintext to encrypt
 * @returns {object} { iv, tag, ciphertext }
 */
export const encrypt = (text) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let ciphertext = cipher.update(text, "utf8", "hex");
    ciphertext += cipher.final("hex");
    const tag = cipher.getAuthTag().toString("hex");

    return {
      iv: iv.toString("hex"),
      tag,
      ciphertext,
    };
  } catch (error) {
    console.error("Encryption error:", error);
    throw new Error("Failed to encrypt data");
  }
};

/**
 * Decrypts ciphertext using AES-256-GCM.
 * @param {string} ciphertext - Hex string of encrypted content
 * @param {string} iv - Hex string of IV
 * @param {string} tag - Hex string of auth tag
 * @returns {string} Plaintext string
 */
export const decrypt = (ciphertext, iv, tag) => {
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    let decrypted = decipher.update(ciphertext, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data. Invalid key, IV, or corrupted payload.");
  }
};

/**
 * Encrypts a binary buffer using AES-256-GCM.
 * @param {Buffer} buffer - Raw file buffer
 * @returns {object} { iv, tag, encryptedBuffer }
 */
export const encryptBuffer = (buffer) => {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const encryptedBuffer = Buffer.concat([
      cipher.update(buffer),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag().toString("hex");

    return {
      iv: iv.toString("hex"),
      tag,
      encryptedBuffer,
    };
  } catch (error) {
    console.error("Buffer encryption error:", error);
    throw new Error("Failed to encrypt file buffer");
  }
};

/**
 * Decrypts an encrypted buffer using AES-256-GCM.
 * @param {Buffer} encryptedBuffer - Encrypted binary data
 * @param {string} iv - Hex string of IV
 * @param {string} tag - Hex string of auth tag
 * @returns {Buffer} Decrypted binary buffer
 */
export const decryptBuffer = (encryptedBuffer, iv, tag) => {
  try {
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(
      ALGORITHM,
      key,
      Buffer.from(iv, "hex")
    );
    decipher.setAuthTag(Buffer.from(tag, "hex"));

    const decryptedBuffer = Buffer.concat([
      decipher.update(encryptedBuffer),
      decipher.final(),
    ]);

    return decryptedBuffer;
  } catch (error) {
    console.error("Buffer decryption error:", error);
    throw new Error("Failed to decrypt file buffer");
  }
};
