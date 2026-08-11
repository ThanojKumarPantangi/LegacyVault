import mongoose from "mongoose";

const verificationCaseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    triggerType: {
      type: String,
      enum: ["INACTIVITY"],
      default: "INACTIVITY",
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "VERIFICATION_REQUIRED",
        "NOMINEE_REQUESTED",
        "ADMIN_REVIEW",
        "APPROVED",
        "REJECTED",
        "RELEASED",
        "EXPIRED",
      ],
      default: "VERIFICATION_REQUIRED",
      index: true,
    },
    triggeredAt: {
      type: Date,
      default: Date.now,
    },
    reviewedAt: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

export const VerificationCase = mongoose.model(
  "VerificationCase",
  verificationCaseSchema
);
