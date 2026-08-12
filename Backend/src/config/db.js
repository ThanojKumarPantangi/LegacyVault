import mongoose from "mongoose";
import { env } from "./env.js";
import { AccessRequest } from "../models/AccessRequest.js";
import { VerificationCase } from "../models/VerificationCase.js";
import { Policy } from "../models/Policy.js";

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

    // Safe index migrations for AccessRequests
    try {
      console.log("[DATABASE] Running startup migration for legacy AccessRequests...");

      const accessRequests = await AccessRequest.find({});
      for (const req of accessRequests) {
        // 1. Resolve missing verificationCaseId if possible (without dummy ObjectIds)
        if (!req.verificationCaseId) {
          const policy = await Policy.findOne({ ownerId: req.ownerId, nomineeId: req.nomineeId });
          if (policy) {
            const vCase = await VerificationCase.findOne({ policyId: policy._id });
            if (vCase) {
              req.verificationCaseId = vCase._id;
              await req.save();
              console.log(`[DATABASE MIGRATION] Mapped verificationCaseId for request ${req._id}`);
            }
          }
        }
      }

      // 2. Programmatically cleanup duplicate requests before building indexes
      const duplicateGroups = await AccessRequest.aggregate([
        { $match: { verificationCaseId: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: {
              verificationCaseId: "$verificationCaseId",
              nomineeId: "$nomineeId",
              assetId: "$assetId"
            },
            count: { $sum: 1 },
            docs: { $push: "$$ROOT" }
          }
        },
        { $match: { count: { $gt: 1 } } }
      ]);

      for (const group of duplicateGroups) {
        console.log(`[DATABASE MIGRATION] Resolving duplicate group: Case: ${group._id.verificationCaseId}, Nominee: ${group._id.nomineeId}, Asset: ${group._id.assetId} with ${group.count} records`);
        // Sort documents: RELEASED first, then APPROVED, then latest creation
        const sortedDocs = group.docs.sort((a, b) => {
          const rank = { RELEASED: 3, APPROVED: 2, PENDING: 1, ADMIN_REVIEW: 1 };
          const rankA = rank[a.status] || 0;
          const rankB = rank[b.status] || 0;
          if (rankA !== rankB) return rankB - rankA;
          return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // Keep the first document, delete the rest
        const keepId = sortedDocs[0]._id;
        for (let i = 1; i < sortedDocs.length; i++) {
          await AccessRequest.deleteOne({ _id: sortedDocs[i]._id });
          console.log(`[DATABASE MIGRATION] Deleted duplicate AccessRequest: ${sortedDocs[i]._id}`);
        }
      }
      console.log("[DATABASE] Completed startup migration for legacy AccessRequests.");
    } catch (migError) {
      console.error("[DATABASE MIGRATION ERROR] Failed legacy migration:", migError.message);
    }
  } catch (error) {
    console.error(`[DATABASE] Connection error: ${error.message}`);
    process.exit(1);
  }
};
