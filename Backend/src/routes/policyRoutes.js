import express from "express";
import {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
} from "../controllers/policyController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("USER"));

router.post("/", createPolicy);
router.get("/", getPolicies);
router.get("/:id", getPolicyById);
router.put("/:id", updatePolicy);
router.delete("/:id", deletePolicy);

export default router;
