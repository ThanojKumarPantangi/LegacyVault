import mongoose from "mongoose";

const accessRequestSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nomineeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nominee",
      required: true,
      index: true,
    },
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Asset",
      required: true,
      index: true,
    },
    verificationCaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VerificationCase",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "ADMIN_REVIEW",
        "APPROVED",
        "REJECTED",
        "RELEASED",
        "EXPIRED",
      ],
      default: "PENDING",
      index: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    releasedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique authorization records per case, nominee, and asset, excluding legacy documents without a verificationCaseId
accessRequestSchema.index(
  { verificationCaseId: 1, nomineeId: 1, assetId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      verificationCaseId: { $exists: true, $ne: null }
    }
  }
);

export const AccessRequest = mongoose.model(
  "AccessRequest",
  accessRequestSchema
);
