import express from "express";
import {
  createAccessRequest,
  getAccessRequests,
  getAccessRequestById,
} from "../controllers/accessRequestController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticate);

router.post("/", createAccessRequest);
router.get("/", getAccessRequests);
router.get("/:id", getAccessRequestById);

export default router;
