import mongoose from "mongoose";

const pendingSignupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    verificationTokenHash: {
      type: String,
      required: true,
      index: true,
    },
    verificationTokenExpiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PendingSignup = mongoose.model("PendingSignup", pendingSignupSchema);
