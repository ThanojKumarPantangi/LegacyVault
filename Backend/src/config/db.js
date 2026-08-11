import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  try {
    if (!env.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in the environment variables.");
    }
    const conn = await mongoose.connect(env.MONGO_URI);
    console.log(`[DATABASE] Connected to MongoDB: ${conn.connection.host}`);

    // Drop legacy index username_1 if it exists to avoid duplicate null keys
    try {
      const collections = await mongoose.connection.db.listCollections({ name: "users" }).toArray();
      if (collections.length > 0) {
        await mongoose.connection.db.collection("users").dropIndex("username_1");
        console.log("[DATABASE] Dropped legacy username_1 index from users collection.");
      }
    } catch (indexError) {
      // Index did not exist, safe to ignore
    }
  } catch (error) {
    console.error(`[DATABASE] Connection error: ${error.message}`);
    process.exit(1);
  }
};
