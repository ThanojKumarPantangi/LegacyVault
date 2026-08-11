import express from "express";
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  downloadAssetFile,
} from "../controllers/assetController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";
import { upload } from "../middleware/uploadMiddleware.js";

const router = express.Router();

// Require login for all asset endpoints
router.use(authenticate);

// User-specific management routes
router.post("/", authorize("USER"), upload.single("file"), createAsset);
router.get("/", authorize("USER"), getAssets);
router.get("/:id", getAssetById); // Nominee can access through separate nominee endpoints, but user can fetch details here
router.put("/:id", authorize("USER"), upload.single("file"), updateAsset);
router.delete("/:id", authorize("USER"), deleteAsset);
router.get("/:id/file", downloadAssetFile);

export default router;
