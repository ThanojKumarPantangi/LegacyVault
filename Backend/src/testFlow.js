import mongoose from "mongoose";
import dotenv from "dotenv";
import { User } from "./models/User.js";
import { Asset } from "./models/Asset.js";
import { Nominee } from "./models/Nominee.js";
import { Policy } from "./models/Policy.js";
import { VerificationCase } from "./models/VerificationCase.js";
import { AccessRequest } from "./models/AccessRequest.js";
import { AuditLog } from "./models/AuditLog.js";

// Services
import { connectDB } from "./config/db.js";
import * as authService from "./services/authService.js";
import * as assetService from "./services/assetService.js";
import * as nomineeService from "./services/nomineeService.js";
import * as policyService from "./services/policyService.js";
import * as verificationService from "./services/verificationService.js";

dotenv.config();

const runTest = async () => {
  console.log("====== STARTING LEGACYVAULT E2E SERVICE FLOW TEST ======");
  
  // 1. Connection
  await connectDB();

  // Clear existing test data
  console.log("[TEST] Purging existing database collections for a clean run...");
  await User.deleteMany({ email: { $in: ["owner@test.com", "nominee@test.com", "admin_tester@test.com"] } });
  await AuditLog.deleteMany({});
  await VerificationCase.deleteMany({});
  await AccessRequest.deleteMany({});
  
  // 2. Auth - Create Owner, Nominee, and Admin Accounts
  console.log("[TEST] Step 1: Registering accounts...");
  const ownerResult = await authService.registerUser({
    name: "Owner User",
    email: "owner@test.com",
    password: "Password123",
    role: "USER"
  });
  const ownerId = ownerResult.user._id;
  console.log(`- Registered Owner ID: ${ownerId}`);

  const nomineeResult = await authService.registerUser({
    name: "Nominee User",
    email: "nominee@test.com",
    password: "Password123",
    role: "NOMINEE"
  });
  const nomineeUserId = nomineeResult.user._id;
  console.log(`- Registered Nominee Account ID: ${nomineeUserId}`);

  const adminResult = await authService.registerUser({
    name: "Admin User",
    email: "admin_tester@test.com",
    password: "Password123",
    role: "ADMIN"
  });
  const adminId = adminResult.user._id;
  console.log(`- Registered Admin ID: ${adminId}`);

  // 3. Asset Creation
  console.log("[TEST] Step 2: Depositing secure digital assets...");
  const mockFile = {
    buffer: Buffer.from("Decrypted private legal documents details"),
    originalname: "legal_will.txt",
    mimetype: "text/plain",
    size: 42
  };
  const asset = await assetService.createAsset(ownerId, {
    title: "Crypto Vault Seed Phrase",
    category: "DIGITAL_WALLET",
    description: "Bitcoin and Ethereum private credentials keys",
    sensitiveData: "emerald-glass-ocean-alpha-bravo-seed-phrase-12345"
  }, mockFile);
  const assetId = asset._id;
  console.log(`- Secure Asset created. ID: ${assetId}`);

  // 4. Nominee Mapping
  console.log("[TEST] Step 3: Adding nominee mapping...");
  const nominee = await nomineeService.addNominee(ownerId, {
    name: "Nominee User",
    email: "nominee@test.com",
    relationship: "Sibling"
  });
  const nomineeId = nominee._id;
  console.log(`- Nominee mapped to Owner. Nominee ID: ${nomineeId}. State: ${nominee.status}`);

  // 5. Policy Creation
  console.log("[TEST] Step 4: Activating inheritance policy...");
  const policy = await policyService.createPolicy(ownerId, {
    nomineeId,
    inactivityDays: 3,
    assets: [assetId],
    adminApprovalRequired: true
  });
  console.log(`- Inheritance Policy active. ID: ${policy._id}. Trigger: Inactivity (${policy.inactivityDays} days)`);

  // 6. Simulate Inactivity
  console.log("[TEST] Step 5: Simulating 4 days of user inactivity pulse...");
  const ownerUser = await User.findById(ownerId);
  ownerUser.lastActiveAt = new Date(Date.now() - (4 * 24 * 60 * 60 * 1000 + 10000));
  await ownerUser.save();
  console.log(`- Updated owner's lastActiveAt to: ${ownerUser.lastActiveAt.toISOString()}`);

  // 7. Trigger Inactivity Job
  console.log("[TEST] Step 6: Triggering scheduled Inactivity Check Cron...");
  const jobResult = await verificationService.processInactiveUsers();
  console.log(`- Inactivity scan result: Processed ${jobResult.processed} users, Triggered ${jobResult.triggered} cases`);

  // 8. Discover Inheritance
  console.log("[TEST] Step 7: Nominee discovering triggered inheritances...");
  const inheritances = await verificationService.getAvailableInheritancesForNominee(nomineeUserId);
  console.log(`- Discovered Triggered Inheritances Count: ${inheritances.length}`);
  const claimInfo = inheritances[0];
  console.log(`- Owner: ${claimInfo.owner.name}. Claimable Assets: ${claimInfo.assets.map(a => a.title).join(", ")}`);

  // 9. Request Access
  console.log("[TEST] Step 8: Nominee submitting claim access request...");
  const accessReq = await verificationService.requestAccessForNominee(
    nomineeUserId,
    claimInfo.nomineeId,
    assetId
  );
  console.log(`- Claim Access Request submitted. Request ID: ${accessReq._id}. State: ${accessReq.status}`);

  // 10. Admin Review
  console.log("[TEST] Step 9: Administrator reviewing access request claim...");
  const reviewResult = await verificationService.reviewAccessRequest(
    adminId,
    accessReq._id,
    "APPROVE"
  );
  console.log(`- Claim approved by Admin. Request state: ${reviewResult.status}`);

  // 11. Controlled Decrypt & Release
  console.log("[TEST] Step 10: Nominee releasing and decrypting secure assets...");
  const releasedAsset = await verificationService.releaseAssetToNominee(nomineeUserId, assetId);
  console.log(`- Decrypted Asset Title: "${releasedAsset.title}"`);
  console.log(`- Decrypted Credentials: "${releasedAsset.sensitiveData}"`);

  // Verify equality
  if (releasedAsset.sensitiveData === "emerald-glass-ocean-alpha-bravo-seed-phrase-12345") {
    console.log(">>> [SUCCESS] Decrypted credentials match original secure text!");
  } else {
    console.error(">>> [FAILURE] Decrypted credentials do NOT match original secure text.");
  }

  // 12. Audit Logging
  console.log("[TEST] Step 11: Inspecting security Audit log...");
  const logs = await AuditLog.find().sort({ timestamp: -1 });
  console.log(`- Recorded security audit logs count: ${logs.length}`);
  logs.slice(0, 5).forEach((log, index) => {
    console.log(`  Log ${index+1}: Action: ${log.action} | Resource: ${log.resourceType}`);
  });

  console.log("====== LEGACYVAULT E2E SERVICE FLOW TEST PASSED ======");
  await mongoose.connection.close();
  process.exit(0);
};

runTest().catch(async (error) => {
  console.error("====== TEST RUNNER FAILED WITH EXCEPTION ======");
  console.error(error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});
