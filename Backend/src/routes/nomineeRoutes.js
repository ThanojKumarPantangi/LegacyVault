import express from "express";
import {
  addNominee,
  getNominees,
  getNomineeById,
  updateNominee,
  deleteNominee,
} from "../controllers/nomineeController.js";
import { authenticate } from "../middleware/authenticate.js";
import { authorize } from "../middleware/authorize.js";

const router = express.Router();

router.use(authenticate);
router.use(authorize("USER"));

router.post("/", addNominee);
router.get("/", getNominees);
router.get("/:id", getNomineeById);
router.put("/:id", updateNominee);
router.delete("/:id", deleteNominee);

export default router;
