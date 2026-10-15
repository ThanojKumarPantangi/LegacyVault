import express from "express";
import {
  getDashboardStats,
  getUsers,
  getAccessRequests,
  getAuditLogs,
  simulateInactivity,
} from "../controllers/adminController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("ADMIN"));

router.get("/dashboard", getDashboardStats);
router.get("/users", getUsers);
router.get("/access-requests", getAccessRequests);
router.get("/audit-logs", getAuditLogs);
router.post("/simulate-inactivity", simulateInactivity);

export default router;
