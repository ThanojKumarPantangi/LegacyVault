import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
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
    inactivityDays: {
      type: Number,
      required: [true, "Inactivity period (in days) is required"],
      min: [1, "Inactivity period must be at least 1 day"],
    },
    ownerResponseDays: {
      type: Number,
      required: [true, "Owner response period (in days) is required"],
      min: [1, "Owner response period must be at least 1 day"],
      default: 3,
    },
    nomineeResponseDays: {
      type: Number,
      required: [true, "Nominee response period (in days) is required"],
      min: [1, "Nominee response period must be at least 1 day"],
      default: 7,
    },
    nomineeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Nominee",
      required: true,
    },
    assets: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Asset",
      },
    ],
    adminApprovalRequired: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "COMPLETED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

export const Policy = mongoose.model("Policy", policySchema);
