import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice.js";
import assetReducer from "../features/assets/assetSlice.js";
import nomineeReducer from "../features/nominees/nomineeSlice.js";
import policyReducer from "../features/policies/policySlice.js";
import verificationReducer from "../features/verification/verificationSlice.js";
import adminReducer from "../features/admin/adminSlice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    assets: assetReducer,
    nominees: nomineeReducer,
    policies: policyReducer,
    verification: verificationReducer,
    admin: adminReducer,
  },
});
