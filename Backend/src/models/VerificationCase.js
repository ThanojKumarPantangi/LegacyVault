import mongoose from "mongoose";

const verificationCaseSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Policy",
    },
    nomineeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nominee",
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
        "OWNER_CONFIRMATION_PENDING",
        "NOMINEE_CONFIRMATION_PENDING",
        "ASSET_RELEASE_AUTHORIZED",
        "RELEASED",
        "OWNER_AVAILABLE",
        "NOMINEE_OWNER_AVAILABLE",
        // Legacy statuses for backward compatibility:
        "PENDING",
        "VERIFICATION_REQUIRED",
        "NOMINEE_REQUESTED",
        "ADMIN_REVIEW",
        "APPROVED",
        "REJECTED",
        "EXPIRED",
      ],
      default: "OWNER_CONFIRMATION_PENDING",
      index: true,
    },
    ownerTokenHash: {
      type: String,
      index: true,
    },
    ownerResponseDeadline: {
      type: Date,
    },
    nomineeTokenHash: {
      type: String,
      index: true,
    },
    nomineeResponseDeadline: {
      type: Date,
    },
    ownerAvailabilityEmailSentAt: {
      type: Date,
    },
    nomineeAvailabilityEmailSentAt: {
      type: Date,
    },
    releaseNotificationSentAt: {
      type: Date,
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

// Only one active inheritance verification case can exist per policy at any given time
verificationCaseSchema.index(
  { policyId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [
        "OWNER_CONFIRMATION_PENDING",
        "NOMINEE_CONFIRMATION_PENDING",
        "ASSET_RELEASE_AUTHORIZED"
      ]}
    }
  }
);

export const VerificationCase = mongoose.model(
  "VerificationCase",
  verificationCaseSchema
);
