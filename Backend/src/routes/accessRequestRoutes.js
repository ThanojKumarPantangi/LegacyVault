import express from "express";
import {
  getAccessRequests,
  getAccessRequestById,
} from "../controllers/accessRequestController.js";
import { authenticate } from "../middleware/authenticate.js";

const router = express.Router();

router.use(authenticate);

// POST route for creating access request has been deprecated
router.get("/", getAccessRequests);
router.get("/:id", getAccessRequestById);

export default router;
