import express from "express";
import {
  getAvailableInheritances,
  submitAccessRequest,
  getReleasedAsset,
  downloadReleasedFile,
} from "../controllers/verificationController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("NOMINEE"));

router.get("/available", getAvailableInheritances);
router.post("/request", submitAccessRequest);
router.get("/released/:assetId", getReleasedAsset);
router.get("/released/:assetId/file", downloadReleasedFile);

export default router;
