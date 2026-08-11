import cron from "node-cron";
import { processInactiveUsers } from "../services/verificationService.js";

/**
 * Initializes the node-cron inactivity checker job.
 * Runs every minute in development/test environments for fast simulation.
 */
export const initInactivityJob = () => {
  cron.schedule("* * * * *", async () => {
    try {
      const result = await processInactiveUsers();
      if (result.triggered > 0) {
        console.log(
          `[INACTIVITY JOB] Completed check. Processed ${result.processed} users, triggered ${result.triggered} new verification cases.`
        );
      }
    } catch (error) {
      console.error("[INACTIVITY JOB ERROR] Job failed:", error.message);
    }
  });

  console.log("[INACTIVITY JOB] Job scheduled successfully (runs every minute).");
};
