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
import * as notificationService from "./services/notificationService.js";

dotenv.config();

// Global stub for email payload capture
let lastEmailSent = null;
notificationService.setEmailHook((payload) => {
  lastEmailSent = payload;
  console.log(`  [MOCK EMAIL SENT] To: ${payload.to} | Subject: ${payload.subject}`);
  return { message: "Mock email sent successfully" };
});

const runTest = async () => {
  console.log("====== STARTING LEGACYVAULT NEW E2E WORKFLOW TESTS ======");
  
  // 1. Connection
  await connectDB();

  // Clean data
  await User.deleteMany({ email: { $in: ["owner@test.com", "nominee@test.com", "other_nominee@test.com", "admin@legacy.com"] } });
  await AuditLog.deleteMany({});
  await VerificationCase.deleteMany({});
  await AccessRequest.deleteMany({});
  await Policy.deleteMany({});
  await Nominee.deleteMany({});
  await Asset.deleteMany({});

  // 2. Register accounts
  console.log("\n[TEST] 1. Registering accounts...");
  const ownerResult = await authService.registerUser({
    name: "Owner User",
    email: "owner@test.com",
    password: "Password123",
    role: "USER"
  });
  const ownerId = ownerResult.user._id;

  const nomineeResult = await authService.registerUser({
    name: "Nominee User",
    email: "nominee@test.com",
    password: "Password123",
    role: "NOMINEE"
  });
  const nomineeUserId = nomineeResult.user._id;

  const otherNomineeResult = await authService.registerUser({
    name: "Other Nominee",
    email: "other_nominee@test.com",
    password: "Password123",
    role: "NOMINEE"
  });
  const otherNomineeUserId = otherNomineeResult.user._id;

  // 3. Create asset
  console.log("[TEST] 2. Depositing secure asset...");
  const asset = await assetService.createAsset(ownerId, {
    title: "Crypto Wallet Wallet Credentials Key",
    category: "DIGITAL_WALLET",
    description: "Bitcoin seeds phrase credentials",
    sensitiveData: "sapphire-creek-forest-gamma-bravo-12345"
  });
  const assetId = asset._id;

  // 4. Map nominees
  console.log("[TEST] 3. Adding nominees...");
  const nominee = await nomineeService.addNominee(ownerId, {
    name: "Nominee User",
    email: "nominee@test.com",
    relationship: "Sibling"
  });
  const nomineeId = nominee._id;

  const otherNominee = await nomineeService.addNominee(ownerId, {
    name: "Other Nominee",
    email: "other_nominee@test.com",
    relationship: "Friend"
  });
  const otherNomineeId = otherNominee._id;

  // 5. Create policy
  console.log("[TEST] 4. Activating policy...");
  const policy = await policyService.createPolicy(ownerId, {
    nomineeId,
    inactivityDays: 3,
    ownerResponseDays: 2,
    nomineeResponseDays: 4,
    assets: [assetId]
  });

  // Helper to reset owner inactivity
  const triggerInactivity = async () => {
    const ownerUser = await User.findById(ownerId);
    ownerUser.lastActiveAt = new Date(Date.now() - (4 * 24 * 60 * 60 * 1000));
    await ownerUser.save();
  };

  // ----------------------------------------------------
  // Scenario A: Owner availability link click stops workflow
  // ----------------------------------------------------
  console.log("\n[SCENARIO A] Owner availability response stops workflow...");
  await triggerInactivity();
  lastEmailSent = null;
  await verificationService.processInactiveUsers();
  
  if (!lastEmailSent) throw new Error("Owner availability email not sent");
  const ownerTokenMatch = lastEmailSent.html.match(/token=([a-f0-9]+)/);
  if (!ownerTokenMatch) throw new Error("Could not find owner token in email HTML");
  const ownerToken = ownerTokenMatch[1];
  
  let vCase = await VerificationCase.findOne({ policyId: policy._id });
  if (vCase.status !== "OWNER_CONFIRMATION_PENDING") throw new Error("Expected status OWNER_CONFIRMATION_PENDING");

  // Owner responds available
  const ownerResponse = await verificationService.respondOwnerAvailability(ownerToken);
  console.log(`  Owner Availability response message: "${ownerResponse.message}"`);
  
  vCase = await VerificationCase.findById(vCase._id);
  if (vCase.status !== "OWNER_AVAILABLE") throw new Error("Case status should be OWNER_AVAILABLE");
  if (vCase.ownerTokenHash) throw new Error("Owner token hash was not invalidated");
  
  console.log(">>> [SUCCESS] Scenario A passed.");

  // ----------------------------------------------------
  // Scenario B: Owner login cancels case
  // ----------------------------------------------------
  console.log("\n[SCENARIO B] Owner login cancels escalation...");
  await VerificationCase.deleteMany({});
  await triggerInactivity();
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findOne({ policyId: policy._id });
  if (vCase.status !== "OWNER_CONFIRMATION_PENDING") throw new Error("Expected status OWNER_CONFIRMATION_PENDING");

  // Simulate owner login
  await authService.loginUser({ email: "owner@test.com", password: "Password123" });

  vCase = await VerificationCase.findById(vCase._id);
  if (vCase.status !== "OWNER_AVAILABLE") throw new Error("Case status should be OWNER_AVAILABLE upon owner login");
  console.log(">>> [SUCCESS] Scenario B passed.");

  // ----------------------------------------------------
  // Scenario C: Nominee says owner is available
  // ----------------------------------------------------
  console.log("\n[SCENARIO C] Nominee responds owner is available...");
  await VerificationCase.deleteMany({});
  await triggerInactivity();
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findOne({ policyId: policy._id });
  // Expire owner response deadline
  vCase.ownerResponseDeadline = new Date(Date.now() - 1000);
  await vCase.save();

  // Run scheduler to transition case
  lastEmailSent = null;
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findById(vCase._id);
  if (vCase.status !== "NOMINEE_CONFIRMATION_PENDING") throw new Error("Expected status NOMINEE_CONFIRMATION_PENDING");

  const nomineeTokenMatch = lastEmailSent.html.match(/token=([a-f0-9]+)/);
  if (!nomineeTokenMatch) throw new Error("Could not find nominee token in email HTML");
  const nomineeToken = nomineeTokenMatch[1];

  // Nominee responds that owner is available
  const nomineeResponse = await verificationService.respondNomineeAvailability(nomineeToken, "available");
  console.log(`  Nominee Response message: "${nomineeResponse.message}"`);

  vCase = await VerificationCase.findById(vCase._id);
  if (vCase.status !== "NOMINEE_OWNER_AVAILABLE") throw new Error("Expected status NOMINEE_OWNER_AVAILABLE");
  
  // Verify no AccessRequest was created
  const requestCount = await AccessRequest.countDocuments({ nomineeId });
  if (requestCount > 0) throw new Error("No AccessRequest should be created for Nominee");
  console.log(">>> [SUCCESS] Scenario C passed.");

  // ----------------------------------------------------
  // Scenario D: Nominee says owner unavailable -> release & repeated access
  // ----------------------------------------------------
  console.log("\n[SCENARIO D] Nominee responds owner is unavailable -> releases assets & repeated access...");
  await VerificationCase.deleteMany({});
  await triggerInactivity();
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findOne({ policyId: policy._id });
  vCase.ownerResponseDeadline = new Date(Date.now() - 1000);
  await vCase.save();

  lastEmailSent = null;
  await verificationService.processInactiveUsers();

  const nomineeTokenMatch2 = lastEmailSent.html.match(/token=([a-f0-9]+)/);
  const nomineeToken2 = nomineeTokenMatch2[1];

  // Nominee responds unavailable
  lastEmailSent = null;
  const nomineeResponse2 = await verificationService.respondNomineeAvailability(nomineeToken2, "unavailable");
  console.log(`  Nominee Response message: "${nomineeResponse2.message}"`);

  vCase = await VerificationCase.findById(vCase._id);
  if (vCase.status !== "RELEASED") throw new Error("Expected status RELEASED");

  // Verify email sent
  if (!lastEmailSent || lastEmailSent.subject !== "LegacyVault Inheritance Release Authorized") {
    throw new Error("Release email notification was not sent correctly");
  }

  // Verify access requests created
  const accessReq = await AccessRequest.findOne({ verificationCaseId: vCase._id, nomineeId, assetId });
  if (!accessReq || accessReq.status !== "APPROVED") throw new Error("Access request must be APPROVED");

  // First decrypt access
  const decrypted1 = await verificationService.releaseAssetToNominee(nomineeUserId, assetId);
  console.log(`  First Decrypted sensitive credentials: "${decrypted1.sensitiveData}"`);
  if (decrypted1.sensitiveData !== "sapphire-creek-forest-gamma-bravo-12345") throw new Error("Credentials mismatch");

  // Repeated decrypt access
  const decrypted2 = await verificationService.releaseAssetToNominee(nomineeUserId, assetId);
  console.log(`  Second Decrypted sensitive credentials: "${decrypted2.sensitiveData}"`);
  if (decrypted2.sensitiveData !== "sapphire-creek-forest-gamma-bravo-12345") throw new Error("Credentials mismatch on repeated access");

  console.log(">>> [SUCCESS] Scenario D passed.");

  // ----------------------------------------------------
  // Scenario E: Nominee deadline expires -> auto release
  // ----------------------------------------------------
  console.log("\n[SCENARIO E] Nominee response deadline expires -> automatic release...");
  await VerificationCase.deleteMany({});
  await AccessRequest.deleteMany({});
  // Reactivate policy status to test new case
  const actPolicy = await Policy.findById(policy._id);
  actPolicy.status = "ACTIVE";
  await actPolicy.save();

  await triggerInactivity();
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findOne({ policyId: policy._id });
  vCase.ownerResponseDeadline = new Date(Date.now() - 1000);
  await vCase.save();

  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findById(vCase._id);
  vCase.nomineeResponseDeadline = new Date(Date.now() - 1000);
  await vCase.save();

  // Run inactivity process to trigger nominee deadline expiry
  lastEmailSent = null;
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findById(vCase._id);
  if (vCase.status !== "RELEASED") throw new Error("Expected case status to be RELEASED");

  // Verify email sent
  if (!lastEmailSent || lastEmailSent.subject !== "LegacyVault Inheritance Release Authorized") {
    throw new Error("Release email was not sent on timeout");
  }

  // Access check
  const decryptedAuto = await verificationService.releaseAssetToNominee(nomineeUserId, assetId);
  if (decryptedAuto.sensitiveData !== "sapphire-creek-forest-gamma-bravo-12345") throw new Error("Credentials mismatch on auto release");
  console.log(">>> [SUCCESS] Scenario E passed.");

  // ----------------------------------------------------
  // Scenario F: Unauthorized nominee & unassigned asset rejection
  // ----------------------------------------------------
  console.log("\n[SCENARIO F] Unauthorized access control...");
  
  // Nominee user otherNomineeUserId tries to access the asset
  try {
    await verificationService.releaseAssetToNominee(otherNomineeUserId, assetId);
    throw new Error("Other nominee accessed unassigned asset!");
  } catch (err) {
    if (err.statusCode !== 403 || err.errorCode !== "ACCESS_DENIED") {
      throw new Error(`Expected 403 ACCESS_DENIED, got ${err.statusCode} - ${err.message}`);
    }
    console.log(`  Blocked other nominee access: 403 ACCESS_DENIED (Correct)`);
  }

  console.log(">>> [SUCCESS] Scenario F passed.");

  console.log("\n[SCENARIO G] Expired token response rejection...");
  await VerificationCase.deleteMany({});
  const actPolicy2 = await Policy.findById(policy._id);
  actPolicy2.status = "ACTIVE";
  await actPolicy2.save();
  await triggerInactivity();
  await verificationService.processInactiveUsers();

  vCase = await VerificationCase.findOne({ policyId: policy._id });
  // Set owner deadline in past
  vCase.ownerResponseDeadline = new Date(Date.now() - 5000);
  await vCase.save();

  // Get raw token from email logs
  const tokenMatchExpired = lastEmailSent.html.match(/token=([a-f0-9]+)/);
  const expiredToken = tokenMatchExpired[1];

  try {
    await verificationService.respondOwnerAvailability(expiredToken);
    throw new Error("Expired token response was not rejected");
  } catch (err) {
    if (err.statusCode !== 400 || err.errorCode !== "LINK_EXPIRED") {
      throw new Error(`Expected LINK_EXPIRED error, got: ${err.message}`);
    }
    console.log(`  Blocked expired owner token response (Correct)`);
  }

  console.log(">>> [SUCCESS] Scenario G passed.");

  console.log("\n====== LEGACYVAULT NEW E2E WORKFLOW TESTS PASSED ======");
  await mongoose.connection.close();
  process.exit(0);
};

runTest().catch(async (error) => {
  console.error("====== E2E WORKFLOW TESTS FAILED ======");
  console.error(error);
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});
