import express from "express";
import {
  getDashboardStats,
  getUsers,
  getAccessRequests,
  approveRequest,
  rejectRequest,
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
router.post("/access-requests/:id/approve", approveRequest);
router.post("/access-requests/:id/reject", rejectRequest);
router.get("/audit-logs", getAuditLogs);
router.post("/simulate-inactivity", simulateInactivity);

export default router;
