import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, "Asset title is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "BANK_ACCOUNT",
        "INSURANCE",
        "INVESTMENT",
        "PROPERTY",
        "DIGITAL_WALLET",
        "PASSWORD",
        "LEGAL_DOCUMENT",
        "IDENTITY_DOCUMENT",
        "PERSONAL_DOCUMENT",
        "OTHER",
      ],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    encryptedData: {
      iv: { type: String },
      tag: { type: String },
      ciphertext: { type: String },
    },
    fileMetadata: {
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
      filename: { type: String }, // Random disk filename
      iv: { type: String },       // IV for file encryption
      tag: { type: String },      // tag for file encryption
    },
    status: {
      type: String,
      enum: ["ACTIVE", "RELEASED"],
      default: "ACTIVE",
    },
  },
  {
    timestamps: true,
  }
);

export const Asset = mongoose.model("Asset", assetSchema);
