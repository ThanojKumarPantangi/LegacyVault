import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../services/apiClient.js";

// Async Thunks
export const fetchAdminStats = createAsyncThunk(
  "admin/fetchAdminStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/dashboard");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUsers = createAsyncThunk(
  "admin/fetchUsers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/users");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAccessRequests = createAsyncThunk(
  "admin/fetchAccessRequests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/access-requests");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const approveAccessRequest = createAsyncThunk(
  "admin/approveAccessRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/admin/access-requests/${requestId}/approve`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const rejectAccessRequest = createAsyncThunk(
  "admin/rejectAccessRequest",
  async ({ requestId, reason }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/admin/access-requests/${requestId}/reject`, { reason });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAuditLogs = createAsyncThunk(
  "admin/fetchAuditLogs",
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get("/admin/audit-logs");
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const simulateInactivity = createAsyncThunk(
  "admin/simulateInactivity",
  async (
    { simulationStage, email, inactivityDays },
    { rejectWithValue }
  ) => {
    try {
      const response = await apiClient.post(
        "/admin/simulate-inactivity",
        {
          simulationStage,
          email,
          inactivityDays,
        }
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          error.message ||
          "Failed to simulate workflow."
      );
    }
  }
);

const initialState = {
  stats: null,
  users: [],
  requests: [],
  auditLogs: [],
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Stats
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Access Requests
      .addCase(fetchAccessRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccessRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchAccessRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Approve Request
      .addCase(approveAccessRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(approveAccessRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = state.requests.map((req) =>
          req._id === action.payload._id ? action.payload : req
        );
      })
      .addCase(approveAccessRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Reject Request
      .addCase(rejectAccessRequest.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(rejectAccessRequest.fulfilled, (state, action) => {
        state.loading = false;
        state.requests = state.requests.map((req) =>
          req._id === action.payload._id ? action.payload : req
        );
      })
      .addCase(rejectAccessRequest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Audit Logs
      .addCase(fetchAuditLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAuditLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.auditLogs = action.payload;
      })
      .addCase(fetchAuditLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Simulate Inactivity
      .addCase(simulateInactivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(simulateInactivity.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(simulateInactivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default adminSlice.reducer;
