import dotenv from "dotenv";

dotenv.config();

const requiredEnv = [
  "MONGO_URI",
  "JWT_SECRET",
  "ENCRYPTION_KEY",
  "BREVO_API_KEY",
  "MAIL_FROM",
  "MAIL_FROM_NAME",
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_BUCKET",
];

for (const envName of requiredEnv) {
  if (!process.env[envName]) {
    console.warn(`[WARNING]: Environment variable ${envName} is missing.`);
  }
}

export const env = {
  MONGO_URI: process.env.MONGO_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  ENCRYPTION_KEY: process.env.ENCRYPTION_KEY,
  PORT: process.env.PORT,
  CLIENT_URL: process.env.CLIENT_URL,
  BREVO_API_KEY: process.env.BREVO_API_KEY,
  MAIL_FROM: process.env.MAIL_FROM,
  MAIL_FROM_NAME: process.env.MAIL_FROM_NAME,
  NODE_ENV: process.env.NODE_ENV,

  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_BUCKET: process.env.SUPABASE_BUCKET,
};