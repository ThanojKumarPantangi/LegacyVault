import mongoose from "mongoose";

const nomineeSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    nomineeUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    name: {
      type: String,
      required: [true, "Nominee name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Nominee email is required"],
      lowercase: true,
      trim: true,
    },
    relationship: {
      type: String,
      required: [true, "Relationship is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate email nominations per owner
nomineeSchema.index({ ownerId: 1, email: 1 }, { unique: true });

export const Nominee = mongoose.model("Nominee", nomineeSchema);
