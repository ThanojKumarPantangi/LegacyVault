import app from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { initInactivityJob } from "./jobs/inactivityJob.js";

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Initialize Inactivity cron checker
    initInactivityJob();

    // 3. Listen for requests
    const PORT = env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(
        `[SERVER] LegacyVault Phase 1 backend running in [${env.NODE_ENV}] mode on port ${PORT}`
      );
    });
  } catch (error) {
    console.error(`[SERVER FATAL ERROR] Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
